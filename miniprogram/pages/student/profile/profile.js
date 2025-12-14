// 学生个人中心页面逻辑
Page({
  data: {
    userInfo: {
      name: '未设置姓名',
      studentNo: '未设置学号',
      phone: '未设置电话',
      college: '未设置学院',
      avatar: ''
    }
  },

  onLoad: function() {
    // 页面加载时获取用户信息
    this.getUserInfo();
  },

  onShow: function() {
    // 页面显示时重新获取用户信息，确保数据最新
    this.getUserInfo();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    // 下拉刷新时重新获取用户信息
    this.getUserInfo(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 从后端获取用户信息
   */
  getUserInfo: function(callback) {
    wx.showLoading({
      title: '加载中...',
    });

    // 从本地存储获取token
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.hideLoading();
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      wx.redirectTo({
        url: '../../index/index'
      });
      return;
    }

    // 发送请求获取用户信息
    wx.request({
      url: 'http://localhost:8090/api/user/current',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data) {
          // 更新用户信息
          const userData = res.data.data;
          this.setData({
            userInfo: {
              name: userData.name || '未设置姓名',
              studentNo: userData.studentNo || '未设置学号',
              phone: userData.phone || '未设置电话',
              college: userData.college || '未设置学院',
              avatar: userData.avatar || ''
            }
          });
        } else {
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
        if (callback) callback();
      }
    });
  },

  // 跳转到编辑个人信息页面
  goToEditProfile: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  // 跳转到设置页面
  goToSettings: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  // 跳转到关于我们页面
  goToAbout: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  // 返回首页
  goToMain: function() {
    wx.navigateBack({
      delta: 1
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
          
          // 跳转到登录页面
          wx.redirectTo({
            url: '../../index/index'
          });
        }
      }
    });
  }
});