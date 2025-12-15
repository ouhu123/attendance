// 学生主页面逻辑
Page({
  data: {
    userInfo: {},
    currentAttendance: null,
    recentAttendances: [],
    stats: {
      totalAttendances: 0,
      attendanceRate: '0.0%',
      lateCount: 0
    },
    // 手势签到相关
    showGestureModal: false,
    currentSessionCode: '',
    gesturePoints: [
      { id: 1, top: 16.67, left: 16.67 },
      { id: 2, top: 16.67, left: 50 },
      { id: 3, top: 16.67, left: 83.33 },
      { id: 4, top: 50, left: 16.67 },
      { id: 5, top: 50, left: 50 },
      { id: 6, top: 50, left: 83.33 },
      { id: 7, top: 83.33, left: 16.67 },
      { id: 8, top: 83.33, left: 50 },
      { id: 9, top: 83.33, left: 83.33 }
    ],
    currentPoints: [],
    gesturePath: '',
    gesture: '',
    gestureCanvasContext: null,
    gestureGridRect: null
  },

  onLoad: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
    }
    
    // 加载当前签到、最近签到记录和统计数据
    this.loadCurrentAttendance();
    this.loadRecentAttendances();
    this.loadStatistics();
    
    // 设置定时刷新，每5秒更新一次当前签到和最近签到记录
    this.refreshTimer = setInterval(() => {
      this.loadCurrentAttendance();
      this.loadRecentAttendances();
    }, 5000);

    // 设置定时器，每秒更新一次剩余时间显示
    this.updateTimer = setInterval(() => {
      this.updateRemainingTime();
    }, 1000);
  },

  // 加载当前进行中的签到
  loadCurrentAttendance: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    // 确保用户信息存在且属性完整
    if (!userInfo || !userInfo.userId) {
      return;
    }
    
    // 这里应该调用实际的API获取当前签到信息
    // 暂时使用模拟数据
    wx.request({
      url: 'http://localhost:8090/api/attendance/student/my-current',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        studentId: userInfo.userId,
        studentNo: userInfo.username
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          // 处理返回数据，将剩余秒数转换为分:秒格式
          const currentAttendance = res.data.data;
          // 确保remainingSeconds是数字类型
          const remainingSeconds = parseInt(currentAttendance.remainingSeconds) || 0;
          // 计算分钟数
          const minutes = Math.floor(remainingSeconds / 60);
          // 计算剩余秒数
          const seconds = remainingSeconds % 60;
          
          console.log('后端返回的签到信息:', currentAttendance);
          console.log('签到类型:', currentAttendance.attendanceType);
          
          this.setData({
            currentAttendance: {
              ...currentAttendance,
              remainingSeconds: remainingSeconds, // 保持数字类型
              remainingMinutes: minutes.toString().padStart(2, '0'), // 显示用字符串
              remainingSecondsDisplay: seconds.toString().padStart(2, '0') // 显示用字符串
            }
          });
        } else {
          this.setData({
            currentAttendance: null
          });
        }
      },
      fail: () => {
        // 网络请求失败，使用模拟数据
        this.setData({
          currentAttendance: {
            courseName: '计算机网络',
            className: '软件工程3班',
            date: '2025-12-12',
            startTime: '14:30',
            endTime: '16:00',
            remainingSeconds: 300,
            remainingMinutes: '05',
            remainingSecondsDisplay: '00',
            // 模拟数据中默认设置为未签到，默认签到类型为二维码签到
            isSigned: false,
            attendanceType: 1
          }
        });
      }
    });
  },

  // 加载最近签到记录
  loadRecentAttendances: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    // 确保用户信息存在且属性完整
    if (!userInfo || !userInfo.userId) {
      return;
    }
    
    // 这里应该调用实际的API获取最近签到记录
    // 暂时使用模拟数据
    wx.request({
      url: 'http://localhost:8090/api/attendance/student/my-recent',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        studentId: userInfo.userId,
        studentNo: userInfo.username || ''
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            recentAttendances: res.data.data
          });
        }
      },
      fail: () => {
        // 网络请求失败，使用模拟数据
        this.setData({
          recentAttendances: [
            {
              id: 1,
              courseName: '计算机网络',
              className: '软件工程3班',
              date: '2025-12-12',
              isSigned: true,
              signTime: '14:35'
            },
            {
              id: 2,
              courseName: '软件工程',
              className: '软件工程3班',
              date: '2025-12-11',
              isSigned: true,
              signTime: '09:10'
            },
            {
              id: 3,
              courseName: '数据库原理',
              className: '软件工程3班',
              date: '2025-12-10',
              isSigned: false
            }
          ]
        });
      }
    });
  },

  // 加载统计数据
  loadStatistics: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    // 确保用户信息存在且属性完整
    if (!userInfo || !userInfo.userId) {
      return;
    }
    
    // 这里应该调用实际的API获取统计数据
    // 暂时使用模拟数据
    wx.request({
      url: 'http://localhost:8090/api/attendance/student/my-statistics',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        studentId: userInfo.userId,
        studentNo: userInfo.username || ''
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            stats: res.data.data
          });
        }
      },
      fail: () => {
        // 网络请求失败，使用模拟数据
        this.setData({
          stats: {
            totalAttendances: 45,
            attendanceRate: '93.3%',
            lateCount: 3
          }
        });
      }
    });
  },

  // 更新剩余时间显示
  updateRemainingTime: function() {
    // 更新当前签到的剩余时间
    if (this.data.currentAttendance && this.data.currentAttendance.remainingSeconds > 0) {
      let remainingSeconds = this.data.currentAttendance.remainingSeconds;
      remainingSeconds--;
      
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      
      this.setData({
        currentAttendance: {
          ...this.data.currentAttendance,
          remainingSeconds: remainingSeconds,
          remainingMinutes: minutes.toString().padStart(2, '0'),
          remainingSecondsDisplay: seconds.toString().padStart(2, '0')
        }
      });
      
      // 如果时间结束，重新加载当前签到状态
      if (remainingSeconds <= 0) {
        setTimeout(() => {
          this.loadCurrentAttendance();
        }, 1000);
      }
    }
  },

  // 扫码签到 - 跳转到新的签到页面
  scanQRCode: function() {
    wx.navigateTo({
      url: '../sign/sign'
    });
  },
  
  // 直接签到（地理位置签到）
  directSignIn: function() {
    // 检查是否有当前签到信息
    if (!this.data.currentAttendance) {
      wx.showToast({
        title: '当前没有进行中的签到',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 获取当前签到的sessionCode和签到类型
    const sessionCode = this.data.currentAttendance.sessionCode;
    // 添加attendanceType字段存在性检查，默认值为1（二维码签到）
    const attendanceType = this.data.currentAttendance.attendanceType || 1;
    
    console.log('directSignIn - 当前签到信息:', this.data.currentAttendance);
    console.log('directSignIn - 签到类型:', attendanceType);
    console.log('directSignIn - 转换后签到类型:', parseInt(attendanceType));
    
    if (!sessionCode) {
      wx.showToast({
        title: '签到信息不完整',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    // 根据签到类型判断是否需要跳转到专门的签到页面
    if (parseInt(attendanceType) === 1) {
      // 二维码签到，跳转到二维码签到页面
      console.log('directSignIn - 进入二维码签到流程，跳转到签到页面');
      wx.navigateTo({
        url: `/pages/student/sign/sign`
      });
    } else if (parseInt(attendanceType) === 2) {
      // 地理位置签到，跳转到地理位置签到页面
      console.log('directSignIn - 进入地理位置签到流程，跳转到位置签到页面');
      wx.navigateTo({
        url: `/pages/student/location-sign/location-sign?sessionCode=${sessionCode}`
      });
    } else if (parseInt(attendanceType) === 3) {
      // 九宫格手势签到，显示手势签到弹窗
      console.log('directSignIn - 进入九宫格手势签到流程，显示手势弹窗');
      this.setData({
        showGestureModal: true,
        currentSessionCode: sessionCode
      });
      // 延迟初始化canvas，确保弹窗已渲染
      setTimeout(() => {
        this.initGestureCanvas();
      }, 100);
    } else {
      // 其他类型签到，直接签到
      console.log('directSignIn - 进入其他类型签到流程，直接签到');
      this.sendSignRequest(sessionCode, userInfo, token, null, null);
    }
  },
  
  // 开始扫码
  startScanCode: function() {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        // 解析二维码内容
        const sessionCode = res.result;
        const userInfo = wx.getStorageSync('userInfo');
        const token = wx.getStorageSync('token');
        
        // 获取当前位置信息
        wx.getLocation({
          type: 'gcj02', // 使用国测局坐标系
          altitude: false, // 不需要海拔信息
          success: (locationRes) => {
            // 调用签到API
            this.sendSignRequest(sessionCode, userInfo, token, locationRes.latitude, locationRes.longitude);
          },
          fail: (error) => {
            console.error('获取位置失败:', error);
            wx.showToast({
              title: '获取地理位置失败，请检查定位服务是否开启',
              icon: 'none',
              duration: 2000
            });
            // 位置获取失败，不允许继续签到
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  
  // 发送签到请求
  sendSignRequest: function(sessionCode, userInfo, token, latitude, longitude, gesture) {
    const postData = {
      studentId: userInfo.userId,
      studentNo: userInfo.username,
      token: sessionCode // 使用token而不是sessionCode
    };
    
    if (gesture) {
      // 九宫格签到，添加手势
      postData.gesture = gesture;
    } else if (latitude !== null && longitude !== null) {
      // 地理位置签到，添加位置信息
      postData.latitude = latitude;
      postData.longitude = longitude;
    }
    
    wx.request({
      url: 'http://localhost:8090/api/attendance/student/sign',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: postData,
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '签到成功',
            icon: 'success',
            duration: 2000
          });
          // 关闭手势弹窗
          this.setData({
            showGestureModal: false,
            currentPoints: [],
            gesturePath: '',
            gesture: ''
          });
          // 重新加载签到数据
          this.loadCurrentAttendance();
          this.loadRecentAttendances();
          this.loadStatistics();
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
  
  // 初始化手势canvas
  initGestureCanvas: function() {
    const query = wx.createSelectorQuery();
    query.select('#gesture-canvas-student').fields({
      node: true,
      size: true
    }).exec((res) => {
      if (res && res[0]) {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        this.setData({
          gestureCanvasContext: ctx,
          gestureGridRect: { width: res[0].width, height: res[0].height }
        });
      }
    });
  },
  
  // 检查点是否在当前路径中
  isPointInPath: function(pointId) {
    const { currentPoints } = this.data;
    return currentPoints.some(p => p.id === pointId);
  },
  
  // 手势开始
  onGestureStart: function(e) {
    const { gestureCanvasContext, gestureGridRect } = this.data;
    
    if (gestureCanvasContext && gestureGridRect) {
      gestureCanvasContext.clearRect(0, 0, gestureGridRect.width, gestureGridRect.height);
    }
    
    this.setData({
      currentPoints: [],
      gesturePath: '',
      gesture: ''
    });
  },
  
  // 手势移动
  onGestureMove: function(e) {
    const { clientX, clientY } = e.touches[0];
    const { gesturePoints, currentPoints, gestureCanvasContext, gestureGridRect } = this.data;
    
    const query = wx.createSelectorQuery();
    query.select('.gesture-grid-student').boundingClientRect();
    query.exec((res) => {
      if (res && res[0]) {
        const grid = res[0];
        
        let closestPoint = null;
        let minDistance = Infinity;
        
        for (const point of gesturePoints) {
          const isPointInPath = currentPoints.some(p => p.id === point.id);
          if (isPointInPath) continue;
          
          const pointX = grid.left + (grid.width * point.left / 100);
          const pointY = grid.top + (grid.height * point.top / 100);
          const distance = Math.sqrt(Math.pow(clientX - pointX, 2) + Math.pow(clientY - pointY, 2));
          
          if (distance < minDistance && distance < 60) {
            minDistance = distance;
            closestPoint = point;
          }
        }
        
        if (closestPoint) {
          const newPoints = [...currentPoints, closestPoint];
          const newPath = newPoints.map(p => p.id).join('');
          
          this.setData({
            currentPoints: newPoints,
            gesturePath: newPath
          });
          
          if (gestureCanvasContext && gestureGridRect) {
            this.drawGesturePath(gestureCanvasContext, gestureGridRect, newPoints);
          }
        }
      }
    });
  },
  
  // 手势结束
  onGestureEnd: function(e) {
    const { currentPoints } = this.data;
    
    if (currentPoints.length < 2) {
      const { gestureCanvasContext, gestureGridRect } = this.data;
      if (gestureCanvasContext && gestureGridRect) {
        gestureCanvasContext.clearRect(0, 0, gestureGridRect.width, gestureGridRect.height);
      }
      
      this.setData({
        gesturePath: '',
        currentPoints: []
      });
    }
  },
  
  // 绘制手势路径
  drawGesturePath: function(ctx, rect, points) {
    if (points.length < 2) return;
    
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#4a90e2';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const x = rect.width * point.left / 100;
      const y = rect.height * point.top / 100;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  },
  
  // 重置手势
  resetGesture: function() {
    const { gestureCanvasContext, gestureGridRect } = this.data;
    
    if (gestureCanvasContext && gestureGridRect) {
      gestureCanvasContext.clearRect(0, 0, gestureGridRect.width, gestureGridRect.height);
    }
    
    this.setData({
      currentPoints: [],
      gesturePath: '',
      gesture: ''
    });
  },
  
  // 确认手势签到
  confirmGestureSign: function() {
    const { currentPoints, currentSessionCode } = this.data;
    
    if (currentPoints.length < 3) {
      wx.showToast({
        title: '手势至少需要3个点',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const gesture = currentPoints.map(p => p.id).join('');
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    this.sendSignRequest(currentSessionCode, userInfo, token, null, null, gesture);
  },
  
  // 关闭手势弹窗
  hideGestureModal: function() {
    this.setData({
      showGestureModal: false,
      currentPoints: [],
      gesturePath: '',
      gesture: ''
    });
  },
  
  // 阻止事件冒泡
  stopPropagation: function() {
    // 空函数，用于阻止点击弹窗内容时关闭弹窗
  },

  // 查看签到记录
  viewAttendanceRecords: function() {
    // 跳转到签到记录页面
    wx.navigateTo({
      url: '../attendance-records/attendance-records'
    });
  },

  // 查看全部签到记录
  viewAllRecords: function() {
    // 跳转到签到记录页面
    wx.navigateTo({
      url: '../attendance-records/attendance-records'
    });
  },

  // 跳转到个人中心
  goToProfile: function() {
    wx.navigateTo({
      url: '../profile/profile'
    });
  },

  // 退出登录
  logout: function() {
    // 显示确认对话框
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息和token
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          // 清除定时器
          if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
          }
          if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
          }
          
          // 跳转到登录页面
          wx.redirectTo({
            url: '../../index/index'
          });
        }
      }
    });
  },

  // 页面显示时刷新数据（当从其他页面返回时调用）
  onShow: function() {
    this.loadCurrentAttendance();
    this.loadRecentAttendances();
    this.loadStatistics();
    
    // 检查是否刚完成签到跳转过来（从本地存储获取）
    const justSigned = wx.getStorageSync('justSigned');
    if (justSigned) {
      // 清除本地存储中的状态标记
      wx.removeStorageSync('justSigned');
      
      // 如果当前有进行中的签到，立即更新其状态
      if (this.data.currentAttendance) {
        // 直接标记为已签到，无需等待API返回
        const currentAttendance = {
          ...this.data.currentAttendance,
          isSigned: true,
          signTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        this.setData({
          currentAttendance: currentAttendance
        });
        
        // 显示已签到提示
        wx.showToast({
          title: '已签到成功',
          icon: 'success',
          duration: 2000
        });
      }
    }
  },

  // 页面卸载时清除定时器
  onUnload: function() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
});