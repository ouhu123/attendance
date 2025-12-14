// pages/teacher/class-management/class-management.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    classList: [],
    teacherInfo: null,
    showAddClassModal: false,
    newClass: {
      className: '',
      grade: '',
      department: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 从本地存储获取教师信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        teacherInfo: userInfo
      })
      
      // 加载班级列表
      this.loadClassList()
    } else {
      wx.showToast({
        title: '教师信息获取失败',
        icon: 'none'
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新班级列表
    this.loadClassList()
  },

  /**
   * 加载班级列表
   */
  loadClassList() {
    const that = this
    const teacherInfo = this.data.teacherInfo
    const teacherId = teacherInfo?.userId || teacherInfo?.id
    
    if (!teacherId) {
      wx.showToast({
        title: '教师信息获取失败',
        icon: 'none'
      })
      return
    }
    
    wx.request({
      url: 'http://localhost:8090/api/class/teacher/details',
      data: {
        teacherId: teacherId
      },
      success(res) {
        if (res.data.code === 200) {
          // 调试日志：打印后端返回的原始数据
          console.log('后端返回的原始数据:', res.data.data);
          
          // 处理课程名称，将字符串分割为数组
          const classList = res.data.data.map((item, index) => {
            // 调试日志：打印单个班级数据的所有属性和值
            console.log(`班级${index + 1} - 所有属性:`, Object.keys(item));
            console.log(`班级${index + 1} - courseCount:`, item.courseCount);
            console.log(`班级${index + 1} - courseNames:`, item.courseNames);
            console.log(`班级${index + 1} - courseNames类型:`, typeof item.courseNames);
            console.log(`班级${index + 1} - courseNames是否为空:`, !item.courseNames || item.courseNames.trim() === '');
            
            // 直接显示课程名称字符串，不进行处理
            console.log(`班级${index + 1} - 直接显示的课程名称:`, item.courseNames);
            
            // 确保courses字段始终存在，即使没有课程数据
            let courses = [];
            
            // 检查是否有courseNames字段并且不为空
            if (item.courseNames && item.courseNames.trim() !== '') {
              // 将课程名称字符串分割为数组
              const courseNamesArray = item.courseNames.split(',');
              // 创建课程对象数组
              courses = courseNamesArray.map(name => ({ courseName: name.trim() }));
            }
            
            // 调试日志：打印处理后的课程数组
            console.log('处理后的课程数组:', courses);
            
            return {
              ...item,
              courses: courses
            };
          });
          
          // 调试日志：打印最终的班级列表
          console.log('最终的班级列表:', classList);
          
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
        })
      }
    })
  },

  /**
   * 打开添加班级对话框
   */
  openAddClassModal() {
    this.setData({
      showAddClassModal: true,
      newClass: {
        className: '',
        grade: '',
        department: ''
      }
    })
  },

  /**
   * 关闭添加班级对话框
   */
  closeAddClassModal() {
    this.setData({
      showAddClassModal: false
    })
  },

  /**
   * 输入班级信息
   */
  inputClassInfo(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    
    this.setData({
      [`newClass.${field}`]: value
    })
  },

  /**
   * 添加班级
   */
  addClass() {
    const { newClass } = this.data
    
    // 验证班级信息
    if (!newClass.className.trim()) {
      wx.showToast({
        title: '班级名称不能为空',
        icon: 'none'
      })
      return
    }
    
    if (!newClass.grade.trim()) {
      wx.showToast({
        title: '年级不能为空',
        icon: 'none'
      })
      return
    }
    
    if (!newClass.department.trim()) {
      wx.showToast({
        title: '系别不能为空',
        icon: 'none'
      })
      return
    }
    
    const that = this
    
    wx.request({
      url: 'http://localhost:8080/api/class/add',
      method: 'POST',
      data: newClass,
      success(res) {
        if (res.data.code === 200) {
          wx.showToast({
            title: '班级添加成功'
          })
          that.closeAddClassModal()
          that.loadClassList() // 刷新班级列表
        } else {
          wx.showToast({
            title: res.data.message || '班级添加失败',
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
   * 查看班级详情
   */
  viewClassDetails(e) {
    console.log('点击查看详情按钮', e);
    // 微信小程序中，data-class-id 会被转换为 dataset.classId（驼峰命名）
    const classId = e.currentTarget.dataset.classId;
    console.log('班级ID:', classId, '数据类型:', typeof classId);
    
    if (classId) {
      wx.navigateTo({
        url: `/pages/teacher/class-details/class-details?classId=${classId}`,
        success: function() {
          console.log('页面跳转成功');
        },
        fail: function(err) {
          console.error('页面跳转失败:', err);
          wx.showToast({
            title: '页面跳转失败: ' + (err.errMsg || '未知错误'),
            icon: 'none',
            duration: 3000
          });
        }
      });
    } else {
      console.error('班级ID为空，dataset:', e.currentTarget.dataset);
      wx.showToast({
        title: '班级ID不存在',
        icon: 'none'
      });
    }
  }
})