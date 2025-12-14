// pages/teacher/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      name: '未设置姓名',
      teacherNo: '未设置工号',
      phone: '未设置电话',
      college: '未设置学院',
      avatar: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时获取用户信息
    this.getUserInfo();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新时重新获取用户信息
    this.getUserInfo(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 从后端获取用户信息
   */
  getUserInfo(callback) {
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
        url: '/pages/login/login',
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
              teacherNo: userData.teacherNo || '未设置工号',
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

  // 编辑资料
  editProfile() {
    wx.navigateTo({
      url: '/pages/teacher/edit-profile/edit-profile',
    })
  },
  // 修改密码
  changePassword() {
    wx.navigateTo({
      url: '/pages/teacher/change-password/change-password',
    })
  },
  // 返回首页
  goToIndex() {
    wx.switchTab({
      url: '/pages/teacher/index/index',
    })
  }
})