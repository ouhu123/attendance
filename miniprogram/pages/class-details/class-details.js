// pages/class-details/class-details.js
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
    this.setData({
      classId: options.classId
    })
    
    // 加载班级详情
    this.loadClassDetails()
    // 加载学生列表
    this.loadStudentList()
  },

  /**
   * 加载班级详情
   */
  loadClassDetails() {
    const that = this
    const app = getApp()
    
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