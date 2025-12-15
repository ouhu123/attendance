// 共用班级管理页面逻辑 - 根据用户角色加载不同的班级管理数据
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    classList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
      
      // 根据用户角色加载不同的数据
      if (userInfo.role === 'teacher') {
        this.loadTeacherClassList();
      } else if (userInfo.role === 'student') {
        this.loadStudentClassList();
      }
    } else {
      wx.showToast({
        title: '用户信息获取失败',
        icon: 'none'
      });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    const userInfo = this.data.userInfo;
    if (userInfo) {
      if (userInfo.role === 'teacher') {
        this.loadTeacherClassList();
      } else if (userInfo.role === 'student') {
        this.loadStudentClassList();
      }
    }
  },

  /**
   * 教师端：加载班级列表
   */
  loadTeacherClassList() {
    const that = this;
    const userInfo = this.data.userInfo;
    const teacherId = userInfo?.userId || userInfo?.id;
    
    if (!teacherId) {
      wx.showToast({
        title: '教师信息获取失败',
        icon: 'none'
      });
      return;
    }
    
    wx.request({
      url: 'http://localhost:8090/api/class/teacher/details',
      data: {
        teacherId: teacherId
      },
      success(res) {
        if (res.data.code === 200) {
          // 直接使用返回的班级数据
          const classList = res.data.data;
          
          that.setData({
            classList: classList
          });
        } else {
          wx.showToast({
            title: '班级列表加载失败',
            icon: 'none'
          });
        }
      },
      fail() {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 学生端：加载班级列表
   */
  loadStudentClassList() {
    const that = this;
    const userInfo = this.data.userInfo;
    const studentId = userInfo?.userId || userInfo?.id;
    
    if (!studentId) {
      wx.showToast({
        title: '学生信息获取失败',
        icon: 'none'
      });
      return;
    }
    
    wx.request({
      url: 'http://localhost:8090/api/class/student/list',
      data: {
        studentId: studentId
      },
      success(res) {
        if (res.data.code === 200) {
          that.setData({
            classList: res.data.data
          });
        } else {
          wx.showToast({
            title: '班级列表加载失败',
            icon: 'none'
          });
        }
      },
      fail(err) {
        console.error('加载班级列表失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 查看班级详情
   */
  viewClassDetails(e) {
    const classId = e.currentTarget.dataset.classId;
    wx.navigateTo({
      url: `/pages/teacher/class-details/class-details?classId=${classId}`
    });
  }
});