// pages/student/sign/sign.js
Page({
  data: {
    locationInfo: null, // 位置信息
    scanResult: null, // 扫码结果
    canSign: false, // 是否可以签到
    sessionInfo: null, // 签到会话信息
    gesturePoints: [], // 手势点位置信息
    touchStartX: 0, // 触摸起始X坐标
    touchStartY: 0, // 触摸起始Y坐标
    currentPoints: [], // 当前触摸的点
    gesturePath: '', // 手势路径
    gesture: '', // 最终确认的手势
    windowWidth: 0, // 屏幕宽度
    windowHeight: 0, // 屏幕高度
    canvasContext: null, // canvas上下文
    gridRect: null // 网格尺寸
  },

  onLoad: function(options) {
    // 页面加载时不自动获取位置信息和验证会话，等待用户点击按钮获取
    // 无论从哪个入口进入，都需要用户主动扫码
    
    // 初始化屏幕尺寸
    const windowInfo = wx.getSystemInfoSync();
    this.setData({
      windowWidth: windowInfo.windowWidth,
      windowHeight: windowInfo.windowHeight
    });
    
    // 初始化手势点位置信息（3x3九宫格）
    const gesturePoints = [
      { id: 1, top: 16.67, left: 16.67 },
      { id: 2, top: 16.67, left: 50 },
      { id: 3, top: 16.67, left: 83.33 },
      { id: 4, top: 50, left: 16.67 },
      { id: 5, top: 50, left: 50 },
      { id: 6, top: 50, left: 83.33 },
      { id: 7, top: 83.33, left: 16.67 },
      { id: 8, top: 83.33, left: 50 },
      { id: 9, top: 83.33, left: 83.33 }
    ];
    
    this.setData({
      gesturePoints: gesturePoints
    });
  },
  
  // 页面渲染完成后初始化canvas
  onReady: function() {
    // 初始化canvas上下文
    const query = wx.createSelectorQuery();
    query.select('#gesture-canvas').fields({
      node: true,
      size: true
    }).exec((res) => {
      if (res && res[0]) {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        // 设置canvas尺寸
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        this.setData({
          canvasContext: ctx,
          gridRect: { width: res[0].width, height: res[0].height }
        });
      }
    });
  },
  
  // 检查点是否在当前路径中
  isPointInPath: function(pointId) {
    const { currentPoints } = this.data;
    return currentPoints.some(p => p.id === pointId);
  },

  // 获取位置信息
  getLocation: function() {
    wx.getLocation({
      type: 'gcj02',
      altitude: false,
      success: (res) => {
        console.log('获取位置成功:', res);
        this.setData({
          locationInfo: {
            latitude: res.latitude,
            longitude: res.longitude,
            address: '' // 可以调用逆地理编码获取详细地址
          }
        });
        this.checkSignConditions();
      },
      fail: (error) => {
        console.error('获取位置失败:', error);
        wx.showToast({
          title: '获取地理位置失败，请检查定位服务是否开启',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 打开地图查看当前位置
  openLocation: function() {
    if (!this.data.locationInfo) {
      wx.showToast({
        title: '请先获取位置信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    wx.openLocation({
      latitude: this.data.locationInfo.latitude,
      longitude: this.data.locationInfo.longitude,
      name: '签到位置',
      address: this.data.locationInfo.address || '当前位置',
      scale: 18
    });
  },

  // 扫码签到
  scanQRCode: function() {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        console.log('扫码成功:', res);
        const token = res.result;
        
        // 直接使用token进行签到，不再验证会话
        this.setData({
          scanResult: {
            token: token
          }
        });
        this.checkSignConditions();
        
        // 显示扫码成功提示
        wx.showToast({
          title: '扫码成功，可进行签到',
          icon: 'success',
          duration: 2000
        });
      },
      fail: (error) => {
        console.error('扫码失败:', error);
        wx.showToast({
          title: '扫码失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 检查签到条件是否满足
  checkSignConditions: function() {
    const { scanResult, sessionInfo, locationInfo, gesture } = this.data;
    
    // 基础条件：必须有扫码结果
    const hasValidScan = !!scanResult;
    
    // 根据签到类型判断是否需要位置信息或手势
    let canSign = false;
    
    if (sessionInfo && sessionInfo.attendanceType === 3) {
      // 九宫格签到：需要手势，不需要位置
      canSign = hasValidScan && !!gesture;
    } else {
      // 其他签到：需要位置，不需要手势
      canSign = hasValidScan && !!locationInfo;
    }
    
    this.setData({
      canSign: canSign
    });
  },

  // 确认签到
  confirmSign: function() {
    if (!this.data.scanResult) return;
    
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    const attendanceToken = this.data.scanResult.token;
    
    // 重新获取地理位置信息，确保使用最新的位置
    wx.getLocation({
      type: 'gcj02',
      altitude: false,
      success: (res) => {
        const latitude = res.latitude;
        const longitude = res.longitude;
        
        // 根据签到类型确定是否需要位置信息和手势
        const { sessionInfo, gesture } = this.data;
        const postData = {
          studentId: userInfo.userId,
          studentNo: userInfo.username,
          token: attendanceToken
        };
        
        if (sessionInfo && sessionInfo.attendanceType === 3) {
          // 九宫格签到：添加手势，不需要位置
          postData.gesture = gesture;
        } else {
          // 其他签到：添加位置，不需要手势
          postData.latitude = latitude;
          postData.longitude = longitude;
        }
        
        wx.request({
          url: 'http://localhost:8090/api/attendance/student/sign',
          method: 'POST',
          header: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          data: postData,
          success: (res) => {
            if (res.data.code === 200) {
          wx.showToast({
            title: '签到成功',
            icon: 'success',
            duration: 2000
          });
          // 存储签到成功状态到本地存储
          wx.setStorageSync('justSigned', true);
          // 签到成功后直接跳转到学生主页面
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/student/main/main'
            });
          }, 2000);
        } else {
          wx.showToast({
            title: res.data.message || '签到失败',
            icon: 'none',
            duration: 2000
          });
        }
          },
          fail: () => {
            wx.showToast({
              title: '网络连接失败',
              icon: 'none',
              duration: 2000
            });
          }
        });
      },
      fail: (error) => {
        console.error('获取位置失败:', error);
        wx.showToast({
          title: '获取地理位置失败，请检查定位服务是否开启',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 重置按钮
  reset: function() {
    this.setData({
      locationInfo: null,
      scanResult: null,
      canSign: false,
      sessionInfo: null,
      currentPoints: [],
      gesturePath: '',
      gesture: ''
    });
    // 重置后自动尝试获取位置
    this.getLocation();
  },
  
  // 手势开始
  onGestureStart: function(e) {
    const { canvasContext, gridRect } = this.data;
    
    // 清除画布
    if (canvasContext && gridRect) {
      canvasContext.clearRect(0, 0, gridRect.width, gridRect.height);
    }
    
    const { clientX, clientY } = e.touches[0];
    this.setData({
      touchStartX: clientX,
      touchStartY: clientY,
      currentPoints: [],
      gesturePath: '',
      gesture: ''
    });
  },
  
  // 手势移动
  onGestureMove: function(e) {
    const { clientX, clientY } = e.touches[0];
    const { gesturePoints, currentPoints } = this.data;
    
    // 获取网格尺寸和位置
    const query = wx.createSelectorQuery();
    query.select('.gesture-grid').boundingClientRect();
    query.exec((res) => {
      if (res && res[0]) {
        const gridRect = res[0];
        
        // 查找最近的点
        let closestPoint = null;
        let minDistance = Infinity;
        
        for (const point of gesturePoints) {
          // 计算点在屏幕上的实际位置
          const pointX = gridRect.left + (point.left / 100) * gridRect.width;
          const pointY = gridRect.top + (point.top / 100) * gridRect.height;
          
          // 计算触摸点与当前点的距离
          const distance = Math.sqrt(Math.pow(clientX - pointX, 2) + Math.pow(clientY - pointY, 2));
          
          if (distance < minDistance && distance < 60) { // 60px的阈值
            minDistance = distance;
            closestPoint = point;
          }
        }
        
        // 如果找到了最近的点，且不在当前点集合中，添加到路径
        if (closestPoint && !currentPoints.some(p => p.id === closestPoint.id)) {
          const newPoints = [...currentPoints, closestPoint];
          const newPath = newPoints.map(p => p.id).join('');
          
          this.setData({
            currentPoints: newPoints,
            gesturePath: newPath
          });
          
          // 绘制手势路径
          this.drawGesturePath(newPoints);
        }
      }
    });
  },
  
  // 手势结束
  onGestureEnd: function(e) {
    const { currentPoints, gesturePath } = this.data;
    
    // 检查手势是否有效（至少包含2个点）
    if (currentPoints.length < 2) {
      wx.showToast({
        title: '手势太短，请重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({
        currentPoints: [],
        gesturePath: '',
        gesture: ''
      });
      // 清除画布
      this.clearGestureCanvas();
      return;
    }
    
    // 保存手势
    this.setData({
      gesture: gesturePath
    });
    
    wx.showToast({
      title: '手势输入成功',
      icon: 'success',
      duration: 2000
    });
    
    // 更新签到条件
    this.checkSignConditions();
    
    // 清除画布
    this.clearGestureCanvas();
  },
  
  // 绘制手势路径
  drawGesturePath: function(points) {
    const { canvasContext, gridRect } = this.data;
    
    if (!canvasContext || !gridRect || points.length < 2) return;
    
    // 设置线条样式
    canvasContext.lineWidth = 4;
    canvasContext.lineCap = 'round';
    canvasContext.lineJoin = 'round';
    canvasContext.strokeStyle = '#4a90e2';
    
    // 清除画布并重新绘制所有路径
    canvasContext.clearRect(0, 0, gridRect.width, gridRect.height);
    
    // 开始绘制
    canvasContext.beginPath();
    
    // 绘制所有点之间的连线
    points.forEach((point, index) => {
      // 计算点在canvas中的坐标
      const pointX = (point.left / 100) * gridRect.width;
      const pointY = (point.top / 100) * gridRect.height;
      
      if (index === 0) {
        canvasContext.moveTo(pointX, pointY);
      } else {
        canvasContext.lineTo(pointX, pointY);
      }
    });
    
    // 绘制路径
    canvasContext.stroke();
  },
  
  // 清除手势画布
  clearGestureCanvas: function() {
    const { canvasContext, gridRect } = this.data;
    
    if (canvasContext && gridRect) {
      canvasContext.clearRect(0, 0, gridRect.width, gridRect.height);
    }
  }
});