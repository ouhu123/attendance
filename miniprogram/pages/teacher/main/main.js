// 教师主页面逻辑
Page({
  data: {
    userInfo: {},
    recentAttendances: [],
    stats: {
      totalCourses: 0,
      todayAttendance: 0,
      averageAttendanceRate: '0.0%'
    }
  },

  onLoad: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
    }
    
    // 加载最近签到记录和统计数据
    this.loadRecentAttendances();
    this.loadStatistics();
    
    // 设置定时刷新，每5秒更新一次最近签到记录，避免频繁加载提示
    this.refreshTimer = setInterval(() => {
      // 定时刷新时不显示加载提示
      this.loadRecentAttendancesWithoutLoading();
    }, 5000);

    // 设置定时器，每秒更新一次剩余时间显示
    this.updateTimer = setInterval(() => {
      this.updateRemainingTime();
    }, 1000);
  },

  // 加载最近签到记录（显示加载提示）
  loadRecentAttendances: function() {
    // 设置标志，显示加载提示和错误提示
    this.setData({
      showLoading: true,
      showErrorToast: true
    });
    
    wx.showLoading({
      title: '加载中...'
    });
    
    this.loadRecentAttendancesCore();
  },
  
  // 加载最近签到记录（不显示加载提示）
  loadRecentAttendancesWithoutLoading: function() {
    this.loadRecentAttendancesCore();
  },
  
  // 加载最近签到记录的核心逻辑
  loadRecentAttendancesCore: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    // 调用API获取真实数据
    wx.request({
      url: 'http://localhost:8090/api/attendance/teacher/recent',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        teacherId: userInfo.userId,
        teacherNo: userInfo.username
      },
      success: (res) => {
        if (res.data.code === 200) {
          // 处理返回数据，将剩余秒数转换为分:秒格式
          const formattedAttendances = res.data.data.map(item => {
            // 确保remainingSeconds是数字类型
            const remainingSeconds = parseInt(item.remainingSeconds) || 0;
            // 计算分钟数
            const minutes = Math.floor(remainingSeconds / 60);
            // 计算剩余秒数
            const seconds = remainingSeconds % 60;
            // 添加格式化后的时间字段
            return {
              ...item,
              remainingSeconds: remainingSeconds, // 保持数字类型
              remainingMinutes: minutes.toString().padStart(2, '0'), // 显示用字符串
              remainingSecondsDisplay: seconds.toString().padStart(2, '0') // 显示用字符串
            };
          });
          
          // 更新最近签到记录
          this.setData({
            recentAttendances: formattedAttendances
          });
        } else {
          // 只有在用户主动刷新时才显示错误提示
          if (this.data.showErrorToast) {
            wx.showToast({
              title: res.data.message || '加载失败',
              icon: 'none'
            });
          }
        }
      },
      fail: (err) => {
        console.error('获取最近签到记录失败:', err);
        // 只有在用户主动刷新时才显示错误提示
        if (this.data.showErrorToast) {
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          });
        }
      },
      complete: () => {
        // 如果显示了加载提示，则隐藏它
        if (this.data.showLoading) {
          wx.hideLoading();
        }
        // 重置错误提示标志
        this.setData({
          showErrorToast: false,
          showLoading: false
        });
      }
    });
  },

  // 加载统计数据
  loadStatistics: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    if (!userInfo || !userInfo.userId) {
      console.error('用户信息不完整，无法获取统计数据');
      return;
    }
    
    // 调用API获取统计数据
    wx.request({
      url: 'http://localhost:8090/api/attendance/teacher/stats',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        teacherId: userInfo.userId
      },
      success: (res) => {
        if (res.data.code === 200) {
          // 更新统计数据
          this.setData({
            stats: res.data.data
          });
        } else {
          console.error('获取统计数据失败:', res.data.message);
          wx.showToast({
            title: res.data.message || '获取统计数据失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取统计数据失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
      }
    });
  },

  // 发起签到
  initiateAttendance: function() {
    wx.navigateTo({
      url: '/pages/teacher/initiate-attendance/initiate-attendance'
    });
  },

  // 查看签到记录
  viewAttendanceRecords: function() {
    wx.navigateTo({
      url: '/pages/teacher/attendance-records/attendance-records'
    });
  },

  // 查看全部记录
  viewAllRecords: function() {
    this.viewAttendanceRecords();
  },
  
  // 查看签到详情
  viewAttendanceDetail: function(e) {
    const sessionId = e.currentTarget.dataset.id;
    console.log('查看签到详情，sessionId:', sessionId);
    if (!sessionId) {
      wx.showToast({
        title: '签到信息不完整',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/teacher/attendance-detail/attendance-detail?sessionId=' + sessionId,
      success: function() {
        console.log('页面跳转成功');
      },
      fail: function(err) {
        console.error('页面跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 前往个人资料
  goToProfile: function() {
    wx.navigateTo({
      url: '/pages/teacher/profile/profile'
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
    // 页面显示时刷新最近签到记录
    this.loadRecentAttendances();
    // 加载统计数据
    this.loadStatistics();
  },
  
  // 更新剩余时间显示
  updateRemainingTime: function() {
    const recentAttendances = this.data.recentAttendances;
    let updated = false;
    
    for (let i = 0; i < recentAttendances.length; i++) {
      const item = recentAttendances[i];
      // 确保remainingSeconds是数字类型
      let remainingSeconds = parseInt(item.remainingSeconds) || 0;
      if (item.status === '进行中' && remainingSeconds > 0) {
        // 减少剩余秒数
        remainingSeconds--;
        
        // 更新分:秒格式
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        
        item.remainingSeconds = remainingSeconds; // 保持数字类型
        item.remainingMinutes = minutes.toString().padStart(2, '0'); // 显示用字符串
        item.remainingSecondsDisplay = seconds.toString().padStart(2, '0'); // 显示用字符串
        
        updated = true;
        
        // 如果时间到了，更新状态
        if (item.remainingSeconds <= 0) {
          item.status = '已结束';
        }
      }
    }
    
    if (updated) {
      this.setData({
        recentAttendances: recentAttendances
      });
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