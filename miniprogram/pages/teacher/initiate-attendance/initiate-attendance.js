// 发起签到页面逻辑
Page({
  data: {
    formData: {
      courseName: '',
      className: '',
      duration: '10',
      attendanceType: 1, // 1: 二维码签到, 2: 地理位置签到, 3: 九宫格签到
      radius: 50, // 默认签到距离50米
      gesture: '' // 九宫格签到手势
    },
    errorMessages: {
      duration: ''
    },
    courses: [],
    classes: [],
    courseIndex: 0,
    classIndex: 0,
    attendanceTypes: [
      {id: 1, name: '二维码签到'},
      {id: 2, name: '地理位置签到'},
      {id: 3, name: '九宫格签到'}
    ],
    attendanceTypeIndex: 0,
    distanceOptions: [
      {value: 50, label: '50米'},
      {value: 100, label: '100米'},
      {value: 200, label: '200米'}
    ],
    location: null,
    locationText: '点击获取当前位置',
    showQRCode: false,
    showAttendanceStatus: false,
    qrCodeImage: '',
    sessionCode: '',
    attendanceCount: 0,
    totalStudents: 0,
    attendancePercentage: 0,
    remainingSeconds: 0,
    remainingMinutes: 0,
    remainingSecondsDisplay: '00',
    isEnded: false,
    attendanceType: '',
    // 九宫格手势点位置（百分比）
    gesturePoints: [
      {id: 1, top: 16.67, left: 16.67},
      {id: 2, top: 16.67, left: 50},
      {id: 3, top: 16.67, left: 83.33},
      {id: 4, top: 50, left: 16.67},
      {id: 5, top: 50, left: 50},
      {id: 6, top: 50, left: 83.33},
      {id: 7, top: 83.33, left: 16.67},
      {id: 8, top: 83.33, left: 50},
      {id: 9, top: 83.33, left: 83.33}
    ],
    gesturePath: '',
    gestureSet: false,
    currentPoints: [],
    touchStartX: 0,
    touchStartY: 0,
    canvasContext: null,
    gridRect: null,
    showGestureModal: false, // 手势设置弹窗显示状态
    modalCanvasContext: null, // 弹窗中的canvas上下文
    modalGridRect: null, // 弹窗中的网格尺寸
  },

  // 页面加载时获取数据
  onLoad: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    console.log('页面加载时的用户信息:', userInfo);
    if (userInfo && userInfo.userId) {
      console.log('调用获取课程列表API，teacherId:', userInfo.userId);
      // 获取教师的课程列表
      this.getTeacherCourses(userInfo.userId);
      
      // 获取教师的班级列表
      console.log('调用获取班级列表API，teacherId:', userInfo.userId);
      this.getTeacherClasses(userInfo.userId);
      
    } else {
      console.error('用户信息不完整或不存在:', userInfo);
    }
  },

  // 获取教师的课程列表
  getTeacherCourses: function(teacherId) {
    const that = this;
    console.log('开始获取课程列表，teacherId:', teacherId);
    console.log('当前token:', wx.getStorageSync('token'));
    
    wx.request({
      url: 'http://localhost:8090/api/attendance/courses',
      method: 'GET',
      data: {
        teacherId: teacherId
      },
      // 暂时移除Authorization头以测试API是否能正常访问
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('课程列表API响应:', res);
        console.log('课程列表数据:', res.data);
        if (res.data.code === 200) {
          console.log('获取到的课程数据:', res.data.data);
          const courses = res.data.data.map(course => ({name: course}));
          console.log('转换后的课程数据:', courses);
          const initialCourse = courses.length > 0 ? courses[0] : null;
          that.setData({
            courses: courses,
            courseIndex: initialCourse ? 0 : -1,
            'formData.courseName': initialCourse ? initialCourse.name : ''
          }, () => {
            // setData回调函数，确保数据已经更新
            console.log('setData回调中的课程数据:', that.data.courses);
            console.log('setData回调中的课程数量:', that.data.courses.length);
            console.log('setData回调中的courseIndex:', that.data.courseIndex);
            console.log('setData回调中的formData.courseName:', that.data.formData.courseName);
          });
        } else {
          console.error('课程列表API返回错误:', res.data.message);
        }
      },
      fail: (err) => {
        console.error('获取课程列表失败:', err);
        console.error('错误详细信息:', JSON.stringify(err));
      },
      complete: () => {
        console.log('课程列表API请求完成');
      }
    });
  },

  // 获取教师的班级列表
  getTeacherClasses: function(teacherId) {
    const that = this;
    console.log('开始获取班级列表，teacherId:', teacherId);
    console.log('当前token:', wx.getStorageSync('token'));
    
    wx.request({
      url: 'http://localhost:8090/api/attendance/classes',
      method: 'GET',
      data: {
        teacherId: teacherId
      },
      // 暂时移除Authorization头以测试API是否能正常访问
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('班级列表API响应:', res);
        console.log('班级列表数据:', res.data);
        if (res.data.code === 200) {
          console.log('获取到的班级数据:', res.data.data);
          let classesData = res.data.data;
          
          // 检查数据格式：如果是字符串数组，转换为对象数组
          if (Array.isArray(classesData) && classesData.length > 0 && typeof classesData[0] === 'string') {
            console.log('检测到字符串数组，转换为对象数组');
            classesData = classesData.map(className => ({ name: className }));
          }
          
          console.log('转换后的班级数据:', classesData);
          const initialClass = classesData.length > 0 ? classesData[0] : null;
          that.setData({
            classes: classesData,
            classIndex: initialClass ? 0 : -1,
            'formData.className': initialClass ? initialClass.name : ''
          }, () => {
            // setData回调函数，确保数据已经更新
            console.log('setData回调中的班级数据:', that.data.classes);
            console.log('setData回调中的班级数量:', that.data.classes.length);
            console.log('setData回调中的classIndex:', that.data.classIndex);
            console.log('setData回调中的formData.className:', that.data.formData.className);
          });
        } else {
          console.error('班级列表API返回错误:', res.data.message);
        }
      },
      fail: (err) => {
        console.error('获取班级列表失败:', err);
        console.error('错误详细信息:', JSON.stringify(err));
      },
      complete: () => {
        console.log('班级列表API请求完成');
      }
    });
  },

  // 输入框变化处理
  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    let errorMessage = '';
    
    // 如果是时长字段，进行验证但保留原始输入
    if (field === 'duration') {
      // 验证是否为有效的正整数
      if (value === '') {
        errorMessage = '请输入有效的整数';
      } else if (!/^\d+$/.test(value)) {
        errorMessage = '请输入有效的整数';
      } else if (parseInt(value) < 1) {
        errorMessage = '时长不能小于1分钟';
      }
    }
    
    // 更新表单数据和错误信息
    this.setData({
      [`formData.${field}`]: value,
      [`errorMessages.${field}`]: errorMessage
    });
  },

  // 课程选择变化
  onCourseChange: function(e) {
    const index = e.detail.value;
    this.setData({
      courseIndex: index,
      'formData.courseName': this.data.courses[index].name
    });
  },

  // 班级选择变化
  onClassChange: function(e) {
    const index = e.detail.value;
    this.setData({
      classIndex: index,
      'formData.className': this.data.classes[index].name
    });
  },

  // 签到方式选择变化
  onAttendanceTypeChange: function(e) {
    const index = e.detail.value;
    this.setData({
      attendanceTypeIndex: index,
      'formData.attendanceType': this.data.attendanceTypes[index].id
    });
  },
  
  // 签到距离变化处理
  onDistanceChange: function(e) {
    const radius = parseInt(e.detail.value);
    
    this.setData({
      'formData.radius': radius
    });
  },

  // 获取当前位置
  getLocation: function() {
    const that = this;
    
    // 1. 使用wx.getLocation获取经纬度
    wx.getLocation({
      type: 'gcj02', // 坐标系选择gcj02（火星坐标系）
      altitude: true, // 获取高度信息
      success: function(res) {
        const latitude = res.latitude;
        const longitude = res.longitude;
        const speed = res.speed;
        const accuracy = res.accuracy;
        
        console.log('获取到的位置信息:', res);
        
        // 2. 直接保存位置信息到页面数据中，不需要用户在地图上确认
        const locationInfo = {
          latitude: latitude,
          longitude: longitude,
          speed: speed,
          accuracy: accuracy
        };
        
        // 使用经纬度作为位置文本显示
        const locationText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        that.setData({
          location: locationInfo,
          locationText: locationText
        });
        
        // 3. 可选：打开地图让用户查看当前位置
        wx.openLocation({
          latitude: latitude,
          longitude: longitude,
          scale: 18, // 缩放比例，范围5-18
          name: '当前位置', // 位置名称
          address: '当前签到位置', // 地址详情说明
          success: function() {
            console.log('地图打开成功');
          },
          fail: function(err) {
            console.error('打开地图失败:', err);
            // 即使地图打开失败，位置信息已经保存，不影响签到
          }
        });
        
        wx.showToast({
          title: '位置获取成功',
          icon: 'success'
        });
      },
      fail: function(err) {
        console.error('获取位置失败:', err);
        
        // 检查是否是用户拒绝授权
        if (err.errMsg.indexOf('auth deny') > -1 || err.errMsg.indexOf('auth denied') > -1) {
          wx.showModal({
            title: '授权提示',
            content: '需要您授权获取位置信息，请在设置中打开位置授权',
            success: function(res) {
              if (res.confirm) {
                // 打开设置页面
                wx.openSetting({
                  success: function(settingRes) {
                    console.log('设置页面返回:', settingRes);
                  }
                });
              }
            }
          });
        } else {
          wx.showToast({
            title: '获取位置失败',
            icon: 'none'
          });
        }
      },
      complete: function() {
        console.log('位置获取流程完成');
      }
    });
  },

  // 发起签到
  initiateAttendance: function() {
    const { courseName, className, duration, attendanceType, gesture } = this.data.formData;
    const { location } = this.data;
    
    // 表单验证
    if (!courseName || !className) {
      wx.showToast({
        title: '请填写课程和班级信息',
        icon: 'none'
      });
      return;
    }
    
    // 验证时长
    if (!duration || !/^\d+$/.test(duration) || parseInt(duration) < 1) {
      wx.showToast({
        title: '请输入有效的签到时长',
        icon: 'none'
      });
      return;
    }
    
    // 九宫格签到时验证手势
    if (attendanceType === 3) {
      if (!gesture || gesture.length < 3) {
        wx.showToast({
          title: '请设置有效的手势',
          icon: 'none'
        });
        return;
      }
    } else {
      // 非九宫格签到时需要位置信息
      if (!location) {
        wx.showToast({
          title: '请先获取位置信息',
          icon: 'none'
        });
        return;
      }
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '发起签到中...'
    });
    
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    
    // 调用API发起签到
    wx.request({
      url: 'http://localhost:8090/api/attendance/initiate',
      method: 'POST',
      data: {
        teacherId: userInfo.userId,
        teacherNo: userInfo.username,
        courseName: courseName,
        className: className,
        longitude: attendanceType === 3 ? 0 : location.longitude,
        latitude: attendanceType === 3 ? 0 : location.latitude,
        duration: parseInt(duration),
        attendanceType: attendanceType,
        radius: this.data.formData.radius,
        gesture: attendanceType === 3 ? gesture : null
      },
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.data.code === 200) {
            // 计算初始剩余时间
            const endTime = new Date(res.data.data.endTime);
            const now = new Date();
            const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            const secondsDisplay = seconds < 10 ? '0' + seconds : seconds;
            
            // 根据签到类型显示不同界面
            if (this.data.formData.attendanceType === 1) {
              // 二维码签到，显示二维码
              this.setData({
                showQRCode: true,
                qrCodeImage: `data:image/png;base64,${res.data.data.qrCode}`,
                sessionCode: res.data.data.sessionCode,
                attendanceCount: 0,
                totalStudents: 50, // 模拟数据
                attendancePercentage: 0,
                remainingSeconds: remainingSeconds,
                remainingMinutes: minutes,
                remainingSecondsDisplay: secondsDisplay,
                isEnded: false
              });
              
              // 开始定时更新签到状态
              this.startAttendanceUpdate();
              
              // 开始定时刷新二维码（60秒一次）
              this.startQRCodeRefresh();
            } else if (this.data.formData.attendanceType === 2 || this.data.formData.attendanceType === 3) {
              // 地理位置签到或九宫格签到，显示签到状态
              wx.showToast({
                title: '签到发起成功',
                icon: 'success',
                duration: 1500
              });
              
              // 1.5秒后跳转到首页
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            }
          } else {
            wx.showToast({
              title: res.data.message || '发起签到失败',
              icon: 'none'
            });
          }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
      }
    });
  },

  // 开始更新签到状态
  startAttendanceUpdate: function() {
    // 定时调用后端API获取真实的签到状态
    const that = this;
    this.updateTimer = setInterval(() => {
      wx.request({
        url: 'http://localhost:8090/api/attendance/status',
        method: 'GET',
        data: {
          sessionCode: that.data.sessionCode
        },
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: (res) => {
          if (res.data.code === 200) {
            // 处理剩余时间
            const remainingSeconds = res.data.data.remainingSeconds;
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            const secondsDisplay = seconds < 10 ? '0' + seconds : seconds;
            
            that.setData({
              attendanceCount: res.data.data.attendanceCount,
              totalStudents: res.data.data.totalStudents,
              attendancePercentage: res.data.data.attendancePercentage,
              remainingSeconds: remainingSeconds,
              remainingMinutes: minutes,
              remainingSecondsDisplay: secondsDisplay,
              isEnded: res.data.data.isEnded
            });
            
            // 如果签到已结束，停止更新
            if (res.data.data.isEnded) {
              if (that.updateTimer) {
                clearInterval(that.updateTimer);
                that.updateTimer = null;
              }
              wx.showToast({
                title: '签到已自动结束',
                icon: 'success'
              });
            }
          }
        }
      });
    }, 1000); // 每1秒更新一次签到状态和剩余时间
  },

  // 刷新二维码
  refreshQRCode: function() {
    const that = this;
    wx.request({
      url: 'http://localhost:8090/api/attendance/refresh-qrcode',
      method: 'GET',
      data: {
        sessionCode: that.data.sessionCode
      },
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        if (res.data.code === 200) {
          that.setData({
            qrCodeImage: `data:image/png;base64,${res.data.data.qrCode}`
          });
        }
      }
    });
  },

  // 开始定时刷新二维码
  startQRCodeRefresh: function() {
    const that = this;
    this.qrCodeTimer = setInterval(() => {
      that.refreshQRCode();
    }, 60000); // 每60秒刷新一次二维码
  },

  // 结束签到
  endAttendance: function() {
    // 清除定时器
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    // 清除二维码刷新定时器
    if (this.qrCodeTimer) {
      clearInterval(this.qrCodeTimer);
      this.qrCodeTimer = null;
    }
    
    // 调用API结束签到
    wx.request({
      url: `http://localhost:8090/api/attendance/end?sessionCode=${this.data.sessionCode}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '签到已结束',
            icon: 'success'
          });
          
          // 返回主页面
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.message || '结束签到失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 页面卸载时清除定时器
  onUnload: function() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    if (this.qrCodeTimer) {
      clearInterval(this.qrCodeTimer);
      this.qrCodeTimer = null;
    }
  },
  
  // 返回上一页
  navigateBack: function() {
    wx.navigateBack({
      delta: 1
    });
  },
  
  // 页面渲染完成后初始化canvas
  onReady: function() {
    // 初始化弹窗中的canvas上下文
    this.initModalCanvas();
  },
  
  // 初始化弹窗中的canvas
  initModalCanvas: function() {
    const query = wx.createSelectorQuery();
    query.select('#gesture-canvas-modal').fields({
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
          modalCanvasContext: ctx,
          modalGridRect: { width: res[0].width, height: res[0].height }
        });
      }
    });
  },
  
  // 显示手势设置弹窗
  showGestureModal: function() {
    this.setData({
      showGestureModal: true
    });
    // 延迟初始化canvas，确保弹窗已渲染
    setTimeout(() => {
      this.initModalCanvas();
    }, 100);
  },
  
  // 隐藏手势设置弹窗
  hideGestureModal: function() {
    this.setData({
      showGestureModal: false
    });
  },
  
  // 阻止事件冒泡
  stopPropagation: function() {
    // 空函数，用于阻止点击弹窗内容时关闭弹窗
  },
  
  // 在弹窗中重置手势
  resetGestureInModal: function() {
    const { modalCanvasContext, modalGridRect } = this.data;
    
    // 清除canvas
    if (modalCanvasContext && modalGridRect) {
      modalCanvasContext.clearRect(0, 0, modalGridRect.width, modalGridRect.height);
    }
    
    this.setData({
      currentPoints: [],
      gesturePath: '',
      'formData.gesture': '',
      gestureSet: false
    });
  },
  
  // 在弹窗中确认手势
  confirmGestureInModal: function() {
    const { currentPoints } = this.data;
    
    if (currentPoints.length < 3) {
      wx.showToast({
        title: '手势至少需要3个点',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const gesture = currentPoints.map(p => p.id).join('');
    this.setData({
      'formData.gesture': gesture,
      gestureSet: true,
      showGestureModal: false
    });
    
    wx.showToast({
      title: '手势设置成功',
      icon: 'success',
      duration: 2000
    });
  },
  
  // 检查点是否在当前路径中
  isPointInPath: function(pointId) {
    const { currentPoints } = this.data;
    return currentPoints.some(p => p.id === pointId);
  },
  
  // 手势开始
  onGestureStart: function(e) {
    const { clientX, clientY } = e.touches[0];
    const { modalCanvasContext, modalGridRect } = this.data;
    
    // 清除canvas（使用弹窗中的canvas）
    if (modalCanvasContext && modalGridRect) {
      modalCanvasContext.clearRect(0, 0, modalGridRect.width, modalGridRect.height);
    }
    
    this.setData({
      touchStartX: clientX,
      touchStartY: clientY,
      currentPoints: [],
      gesturePath: ''
    });
  },
  
  // 手势移动
  onGestureMove: function(e) {
    const { clientX, clientY } = e.touches[0];
    const { gesturePoints, currentPoints, modalCanvasContext, modalGridRect } = this.data;
    
    // 获取手势网格的位置（弹窗中的网格）
    const query = wx.createSelectorQuery();
    query.select('.gesture-grid-modal').boundingClientRect();
    query.exec((res) => {
      if (res && res[0]) {
        const grid = res[0];
        
        // 查找最近的点
        let closestPoint = null;
        let minDistance = Infinity;
        
        for (const point of gesturePoints) {
          // 检查点是否已经在当前路径中
          const isPointInPath = currentPoints.some(p => p.id === point.id);
          if (isPointInPath) continue;
          
          // 计算点在网格中的坐标
          const pointX = grid.left + (grid.width * point.left / 100);
          const pointY = grid.top + (grid.height * point.top / 100);
          
          // 计算触摸点与当前点的距离
          const distance = Math.sqrt(Math.pow(clientX - pointX, 2) + Math.pow(clientY - pointY, 2));
          
          if (distance < minDistance && distance < 60) { // 60px的阈值
            minDistance = distance;
            closestPoint = point;
          }
        }
        
        // 如果找到了新的点，更新路径并绘制
        if (closestPoint) {
          const newPoints = [...currentPoints, closestPoint];
          const newPath = newPoints.map(p => p.id).join('');
          
          this.setData({
            currentPoints: newPoints,
            gesturePath: newPath
          });
          
          // 绘制路径（使用弹窗中的canvas）
          if (modalCanvasContext && modalGridRect) {
            this.drawGesturePath(modalCanvasContext, modalGridRect, newPoints);
          }
        }
      }
    });
  },
  
  // 绘制手势路径
  drawGesturePath: function(ctx, rect, points) {
    if (points.length < 2) return;
    
    // 清除画布并重新绘制所有路径
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#4a90e2';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 绘制路径
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
  
  // 手势结束
  onGestureEnd: function(e) {
    // 手势结束时不自动保存，需要用户点击确认按钮
    const { currentPoints } = this.data;
    
    if (currentPoints.length < 2) {
      // 手势太短，清除
      const { modalCanvasContext, modalGridRect } = this.data;
      if (modalCanvasContext && modalGridRect) {
        modalCanvasContext.clearRect(0, 0, modalGridRect.width, modalGridRect.height);
      }
      
      this.setData({
        gesturePath: '',
        currentPoints: []
      });
    }
  },
  
  // 清除手势
  clearGesture: function() {
    const { modalCanvasContext, modalGridRect } = this.data;
    
    // 清除canvas
    if (modalCanvasContext && modalGridRect) {
      modalCanvasContext.clearRect(0, 0, modalGridRect.width, modalGridRect.height);
    }
    
    this.setData({
      'formData.gesture': '',
      gesturePath: '',
      currentPoints: [],
      gestureSet: false
    });
  }
});