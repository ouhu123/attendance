// pages/student/location-sign/location-sign.js
Page({
  data: {
    sessionCode: '',
    sessionInfo: null,
    locationInfo: null,
    distance: 0,
    signResult: null,
    remainingTime: ''
  },

  onLoad: function(options) {
    if (options.sessionCode) {
      this.setData({
        sessionCode: options.sessionCode
      });
      // 获取签到会话信息
      this.getSessionInfo(options.sessionCode);
      // 开始倒计时
      this.startCountdown();
    } else {
      wx.showToast({
        title: '签到信息不完整',
        icon: 'none',
        duration: 2000
      });
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  // 获取签到会话信息
  getSessionInfo: function(sessionCode) {
    const token = wx.getStorageSync('token');
    wx.request({
      url: 'http://localhost:8090/api/attendance/session/' + sessionCode,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            sessionInfo: res.data.data
          });
        } else {
          wx.showToast({
            title: res.data.message || '获取签到信息失败',
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

  // 获取位置信息
  getLocation: function() {
    wx.getLocation({
      type: 'gcj02', // 使用国测局坐标系
      altitude: false,
      success: (res) => {
        console.log('获取位置成功:', res);
        const locationInfo = {
          latitude: res.latitude,
          longitude: res.longitude
        };
        
        this.setData({
          locationInfo: locationInfo
        });
        
        // 计算距离
        this.calculateDistance(res.latitude, res.longitude);
        
        // 获取签到地点信息
        const sessionInfo = this.data.sessionInfo;
        if (sessionInfo) {
          // 打开地图显示当前位置和签到地点
          wx.openLocation({
            latitude: sessionInfo.latitude,
            longitude: sessionInfo.longitude,
            name: sessionInfo.courseName + ' 签到点',
            address: sessionInfo.className,
            scale: 15,
            success: () => {
              console.log('地图打开成功');
            },
            fail: (error) => {
              console.error('地图打开失败:', error);
            }
          });
        }
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

  // 计算距离
  calculateDistance: function(lat1, lng1) {
    const sessionInfo = this.data.sessionInfo;
    if (!sessionInfo) return;
    
    const lat2 = sessionInfo.latitude;
    const lng2 = sessionInfo.longitude;
    
    // 地球半径（米）
    const R = 6371000;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    this.setData({
      distance: distance.toFixed(1)
    });
  },

  // 角度转弧度
  toRadians: function(degrees) {
    return degrees * Math.PI / 180;
  },

  // 发送签到请求
  sendSignRequest: function(latitude, longitude) {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    const sessionCode = this.data.sessionCode;
    
    if (!userInfo || !token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    wx.request({
      url: 'http://localhost:8090/api/attendance/student/sign',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: {
        studentId: userInfo.userId,
        studentNo: userInfo.username,
        sessionCode: sessionCode,
        latitude: latitude,
        longitude: longitude
      },
      success: (res) => {
        console.log('签到请求结果:', res);
        if (res.data.code === 200) {
          this.setData({
            signResult: {
              success: true,
              message: '签到成功'
            }
          });
          // 签到成功后显示提示并跳转到学生主页面
          wx.showToast({
            title: '签到成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              // 延迟跳转到学生主页面
              setTimeout(() => {
                // 存储签到成功状态到本地存储
                wx.setStorageSync('justSigned', true);
                // 使用navigateTo确保页面栈正确
                wx.navigateTo({
                  url: '/pages/student/main/main'
                });
              }, 1500);
            }
          });
        } else {
          this.setData({
            signResult: {
              success: false,
              message: res.data.message || '签到失败'
            }
          });
        }
      },
      fail: () => {
        this.setData({
          signResult: {
            success: false,
            message: '网络连接失败'
          }
        });
      }
    });
  },

  // 开始倒计时
  startCountdown: function() {
    const updateTime = () => {
      const sessionInfo = this.data.sessionInfo;
      if (!sessionInfo) return;
      
      const endTime = new Date(sessionInfo.endTime);
      const now = new Date();
      const remainingMs = endTime - now;
      
      if (remainingMs <= 0) {
        this.setData({
          remainingTime: '签到已结束'
        });
        return;
      }
      
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      
      this.setData({
        remainingTime: minutes + '分' + seconds + '秒'
      });
      
      // 继续更新
      setTimeout(updateTime, 1000);
    };
    
    updateTime();
  },

  // 手动签到方法
  manualSign: function() {
    const locationInfo = this.data.locationInfo;
    if (!locationInfo) {
      wx.showToast({
        title: '请先获取位置信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 发送签到请求
    this.sendSignRequest(locationInfo.latitude, locationInfo.longitude);
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  }
});