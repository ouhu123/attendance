// pages/teacher/change-password/change-password.js
Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPasswordHint: false,
    passwordHint: '',
    canSubmit: false
  },
  
  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack()
  },
  
  /**
   * 旧密码输入事件
   */
  onOldPasswordInput(e) {
    this.setData({
      oldPassword: e.detail.value
    })
    this.checkForm()
  },
  
  /**
   * 新密码输入事件
   */
  onNewPasswordInput(e) {
    const value = e.detail.value
    this.setData({
      newPassword: value
    })
    
    // 验证新密码格式
    this.validatePassword(value)
    this.checkForm()
  },
  
  /**
   * 确认密码输入事件
   */
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    })
    this.checkForm()
  },
  
  /**
   * 验证密码格式
   */
  validatePassword(password) {
    let hint = ''
    let showHint = false
    
    if (password.length < 6) {
      hint = '密码长度不能少于6位'
      showHint = true
    } else if (password.length > 20) {
      hint = '密码长度不能超过20位'
      showHint = true
    } else if (!/[a-z]/.test(password)) {
      hint = '密码必须包含小写字母'
      showHint = true
    } else if (!/[A-Z]/.test(password)) {
      hint = '密码必须包含大写字母'
      showHint = true
    } else if (!/\d/.test(password)) {
      hint = '密码必须包含数字'
      showHint = true
    }
    
    this.setData({
      passwordHint: hint,
      showPasswordHint: showHint
    })
    
    return !showHint
  },
  
  /**
   * 检查表单是否可以提交
   */
  checkForm() {
    const { oldPassword, newPassword, confirmPassword } = this.data
    
    // 验证新密码格式
    const isPasswordValid = this.validatePassword(newPassword)
    
    // 检查所有条件
    const canSubmit = oldPassword !== '' && 
                     newPassword !== '' && 
                     confirmPassword !== '' && 
                     isPasswordValid && 
                     newPassword === confirmPassword &&
                     oldPassword !== newPassword
    
    this.setData({
      canSubmit: canSubmit
    })
  },
  
  /**
   * 修改密码
   */
  changePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data
    
    // 再次验证
    if (!this.data.canSubmit) {
      return
    }
    
    wx.showLoading({
      title: '修改中...',
    })
    
    // 调用修改密码API
    wx.request({
      url: 'http://localhost:8090/api/user/change-password',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      data: {
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      },
      success: (res) => {
        wx.hideLoading()
        
        if (res.data.code === 200) {
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 2000,
            success: () => {
              // 返回上一页
              setTimeout(() => {
                wx.navigateBack()
              }, 2000)
            }
          })
        } else {
          wx.showToast({
            title: res.data.message || '修改失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none',
          duration: 2000
        })
        console.error('修改密码失败:', err)
      }
    })
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
    
  }
})