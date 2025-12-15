// index.js
Page({
  data: {
    // 用户类型：student 或 teacher
    userType: 'student',
    // 登录表单数据
    loginForm: {
      username: '',
      password: '',
    },
    // 动态提示文字
    usernamePlaceholder: '请输入学号',
    passwordPlaceholder: '请输入密码'
  },
  
  // 选择用户类型
  selectUserType(e) {
    const userType = e.currentTarget.dataset.type
    let usernamePlaceholder = '请输入学号'
    let passwordPlaceholder = '请输入密码'
    
    // 根据用户类型设置提示文字
    if (userType === 'student') {
      usernamePlaceholder = '请输入学号'
      passwordPlaceholder = '请输入密码'
    } else if (userType === 'teacher') {
      usernamePlaceholder = '请输入工号'
      passwordPlaceholder = '请输入密码'
    }
    
    this.setData({
      userType: userType,
      usernamePlaceholder: usernamePlaceholder,
      passwordPlaceholder: passwordPlaceholder
    })
  },
  
  // 表单输入变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`loginForm.${field}`]: value
    })
  },
  
  // 登录功能
  login() {
    const { username, password } = this.data.loginForm
    const { userType } = this.data
    
    // 表单验证
    if (!username) {
      wx.showToast({
        title: '请输入账号',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    if (username.length !== 12) {
      wx.showToast({
        title: '请输入12位账号',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '登录中...',
    })
    
    // 调用登录API
    wx.request({
      url: 'http://localhost:8090/api/auth/login',
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        userNo: username,
        password: password,
        userType: userType
      },
      success: (res) => {
        console.log('登录结果:', res)
        
        // 隐藏加载提示
        wx.hideLoading()
        
        if (res.data.code === 200) {
          // 登录成功
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 2000
          })
          
          // 保存用户信息和token
          console.log('登录成功，用户信息:', res.data.data);
          wx.setStorageSync('userInfo', res.data.data)
          wx.setStorageSync('token', res.data.data.token)
          
          // 根据用户类型跳转到对应的首页
          if (userType === 'teacher' || userType === 'student') {
            wx.switchTab({
              url: '../main/main'
            });
          }
        } else {
          // 登录失败
          wx.showToast({
            title: res.data.message || '登录失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        // 隐藏加载提示
        wx.hideLoading()
        
        console.error('登录请求失败:', err)
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
})
