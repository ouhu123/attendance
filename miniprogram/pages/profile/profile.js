// 共用个人中心页面逻辑 - 教师和学生功能完全分开
Page({
  data: {
    userInfo: {},
    // 添加角色标识，方便页面判断
    isTeacher: false,
    isStudent: false
  },

  onLoad: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        isTeacher: userInfo.role === 'teacher',
        isStudent: userInfo.role === 'student'
      });
      
      // 根据用户角色加载不同的个人信息
      if (userInfo.role === 'teacher') {
        this.loadTeacherInfo();
      } else if (userInfo.role === 'student') {
        this.loadStudentInfo();
      }
    } else {
      // 未登录，跳转回登录页
      wx.redirectTo({
        url: '../index/index'
      });
    }
  },

  onShow: function() {
    // 页面显示时重新获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        isTeacher: userInfo.role === 'teacher',
        isStudent: userInfo.role === 'student'
      });
      
      // 根据用户角色加载不同的个人信息
      if (userInfo.role === 'teacher') {
        this.loadTeacherInfo();
      } else if (userInfo.role === 'student') {
        this.loadStudentInfo();
      }
    }
  },

  // 教师端：加载教师个人信息
  loadTeacherInfo: function(callback) {
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
        url: '/pages/index/index',
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
          const updatedUserInfo = {
            ...this.data.userInfo,
            name: userData.name || '未设置姓名',
            teacherNo: userData.teacherNo || '未设置工号',
            phone: userData.phone || '未设置电话',
            college: userData.college || '未设置学院',
            avatar: userData.avatar || ''
          };
          this.setData({
            userInfo: updatedUserInfo
          });
          
          // 保存到本地存储
          wx.setStorageSync('userInfo', updatedUserInfo);
          
          wx.hideLoading();
          if (callback) callback();
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          // 跳转到登录页面
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/index/index',
            });
          }, 2000);
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
        if (callback) callback();
      }
    });
  },

  // 学生端：加载学生个人信息
  loadStudentInfo: function(callback) {
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
        url: '/pages/index/index',
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
          const updatedUserInfo = {
            ...this.data.userInfo,
            name: userData.name || '未设置姓名',
            studentNo: userData.studentNo || '未设置学号',
            phone: userData.phone || '未设置电话',
            college: userData.college || '未设置学院',
            className: userData.className || '未设置班级',
            avatar: userData.avatar || ''
          };
          this.setData({
            userInfo: updatedUserInfo
          });
          
          // 保存到本地存储
          wx.setStorageSync('userInfo', updatedUserInfo);
          
          wx.hideLoading();
          if (callback) callback();
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          // 跳转到登录页面
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/index/index',
            });
          }, 2000);
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
        if (callback) callback();
      }
    });
  },


  // 修改密码
  changePassword: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.role === 'teacher') {
      wx.navigateTo({
        url: '/pages/teacher/change-password/change-password'
      });
    } else {
      wx.navigateTo({
        url: '/pages/student/change-password/change-password'
      });
    }
  },

  // 退出登录
  logout: function() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息和token
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          // 跳转到登录页面
          wx.redirectTo({
            url: '../index/index'
          });
        }
      }
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新时重新获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      if (userInfo.role === 'teacher') {
        this.loadTeacherInfo(() => {
          wx.stopPullDownRefresh();
        });
      } else if (userInfo.role === 'student') {
        this.loadStudentInfo(() => {
          wx.stopPullDownRefresh();
        });
      }
    } else {
      wx.stopPullDownRefresh();
    }
  },

  // 选择并上传头像
  chooseAvatar: function() {
    const that = this;
    
    // 选择图片
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const fileSize = res.tempFiles[0].size;
        
        // 验证文件大小（大于0且不超过2MB）
        if (fileSize <= 0) {
          wx.showToast({
            title: '文件大小错误，不能上传空文件',
            icon: 'none'
          });
          return;
        }
        if (fileSize > 2 * 1024 * 1024) {
          wx.showToast({
            title: '文件大小超过限制，最大支持2MB',
            icon: 'none'
          });
          return;
        }
        
        // 上传图片
        wx.showLoading({
          title: '上传中...',
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
            url: '/pages/index/index',
          });
          return;
        }
        
        // 发送请求上传头像
        wx.uploadFile({
          url: 'http://localhost:8090/api/user/avatar',
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${token}`
          },
          success(uploadRes) {
            // 解析返回结果
            const data = JSON.parse(uploadRes.data);
            if (data.code === 200 && data.data) {
              // 更新用户头像信息
              const updatedUserInfo = {
                ...that.data.userInfo,
                avatar: data.data
              };
              that.setData({
                userInfo: updatedUserInfo
              });
              
              // 保存到本地存储
              wx.setStorageSync('userInfo', updatedUserInfo);
              
              wx.hideLoading();
              wx.showToast({
                title: '头像上传成功',
                icon: 'success'
              });
            } else {
              wx.hideLoading();
              wx.showToast({
                title: data.message || '头像上传失败',
                icon: 'none'
              });
            }
          },
          fail(err) {
            console.error('头像上传失败:', err);
            wx.hideLoading();
            wx.showToast({
              title: '网络错误，请稍后重试',
              icon: 'none'
            });
          }
        });
      },
      fail(err) {
        console.error('选择图片失败:', err);
        if (err.errMsg !== 'chooseMedia:fail cancel') {
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      }
    });
  }
});