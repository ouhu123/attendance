// pages/teacher/class-details/class-details.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    classId: '',
    classDetails: null,
    studentList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('options:', options);
    console.log('options.classId:', options.classId);
    if (options.classId) {
      this.setData({
        classId: options.classId
      });
      
      // 加载班级详情
      this.loadClassDetails();
      // 加载学生列表
      this.loadStudentList();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  /**
   * 加载班级详情
   */
  loadClassDetails() {
    const that = this
    const app = getApp()
    
    console.log('loadClassDetails - this.data.classId:', this.data.classId, '类型:', typeof this.data.classId)
    
    wx.request({
      url: 'http://localhost:8090/api/class/detail',
      data: {
        id: this.data.classId
      },
      success(res) {
        if (res.data.code === 200) {
          that.setData({
            classDetails: res.data.data
          })
        } else {
          wx.showToast({
            title: '班级详情加载失败',
            icon: 'none'
          })
        }
      },
      fail() {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 加载学生列表
   */
  loadStudentList() {
    const that = this
    const classId = this.data.classId
    
    if (!classId) {
      wx.showToast({
        title: '班级ID不存在',
        icon: 'none'
      })
      return
    }
    
    wx.request({
      url: 'http://localhost:8090/api/class/students',
      data: {
        classId: classId
      },
      success(res) {
        if (res.data.code === 200) {
          that.setData({
            studentList: res.data.data || []
          })
        } else {
          wx.showToast({
            title: '学生列表加载失败',
            icon: 'none'
          })
        }
      },
      fail() {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      }
    })
  },



  /**
   * 返回班级管理页面
   */
  goBack() {
    wx.navigateBack()
  }
})