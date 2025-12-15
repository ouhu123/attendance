// 共用班级管理页面逻辑 - 根据用户角色加载不同的班级管理数据
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    classList: [],
    // 教师端相关数据
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
          // 处理课程名称，将字符串分割为数组
          const classList = res.data.data.map((item, index) => {
            // 确保courses字段始终存在，即使没有课程数据
            let courses = [];
            
            // 检查是否有courseNames字段并且不为空
            if (item.courseNames && item.courseNames.trim() !== '') {
              // 将课程名称字符串分割为数组
              const courseNamesArray = item.courseNames.split(',');
              // 创建课程对象数组
              courses = courseNamesArray.map(name => ({ courseName: name.trim() }));
            }
            
            return {
              ...item,
              courses: courses
            };
          });
          
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
    
    console.log('学生信息:', userInfo);
    console.log('学生ID:', studentId);
    
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
        console.log('API请求成功，状态码:', res.statusCode);
        console.log('API返回数据:', res.data);
        
        // 检查API返回的数据结构
        if (res.statusCode === 200) {
          // 处理HTTP 200但业务逻辑失败的情况
          if (res.data && res.data.code === 200) {
            console.log('班级列表数据:', res.data.data);
            
            // 检查返回的数据是否为空
            if (res.data.data && res.data.data.length > 0) {
              // 处理课程数据，将课程名称分割为独立的课程对象
              let allCourses = [];
              
              res.data.data.forEach(classItem => {
                if (classItem.courseNames && classItem.courseNames.trim() !== '') {
                  // 将课程名称字符串分割为数组
                  const courseNamesArray = classItem.courseNames.split(',');
                  // 为每个课程创建独立的对象
                  courseNamesArray.forEach(courseName => {
                    if (courseName.trim() !== '') {
                      allCourses.push({
                        id: `${classItem.id}_${courseName.trim()}`,
                        courseName: courseName.trim()
                      });
                    }
                  });
                } else if (classItem.courseName && classItem.courseName.trim() !== '') {
                  // 如果只有单个课程名称
                  allCourses.push({
                    id: `${classItem.id}_${classItem.courseName.trim()}`,
                    courseName: classItem.courseName.trim()
                  });
                }
              });
              
              that.setData({
                classList: allCourses
              });
            } else {
              console.log('班级列表为空');
              that.setData({
                classList: []
              });
            }
          } else {
            // 处理业务逻辑失败的情况
            console.error('API业务逻辑失败，完整响应数据:', res);
            
            // 确保错误信息存在
            const errorMessage = res.data?.message || '未知错误';
            const apiCode = res.data?.code;
            
            console.error('班级列表加载失败，错误信息:', errorMessage);
            console.error('API返回的状态码:', apiCode);
            
            wx.showToast({
              title: `班级列表加载失败: ${errorMessage}`,
              icon: 'none'
            });
            
            // 设置空的班级列表
            that.setData({
              classList: []
            });
          }
        } else {
          // 处理HTTP请求失败的情况
          console.error('HTTP请求失败，状态码:', res.statusCode);
          console.error('完整响应数据:', res);
          
          wx.showToast({
            title: `网络请求失败，状态码: ${res.statusCode}`,
            icon: 'none'
          });
          
          // 设置空的班级列表
          that.setData({
            classList: []
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
   * 教师端：打开添加班级对话框
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
   * 教师端：关闭添加班级对话框
   */
  closeAddClassModal() {
    this.setData({
      showAddClassModal: false
    })
  },

  /**
   * 教师端：输入班级信息
   */
  inputClassInfo(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    
    this.setData({
      [`newClass.${field}`]: value
    })
  },

  /**
   * 教师端：添加班级
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
          that.loadTeacherClassList() // 刷新班级列表
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
   * 查看班级/课程详情
   */
  viewClassDetails(e) {
    const classId = e.currentTarget.dataset.classId;
    const courseId = e.currentTarget.dataset.courseId;
    const userInfo = this.data.userInfo;
    const courseName = e.currentTarget.dataset.courseName;
    
    if (userInfo.role === 'teacher') {
      // 教师端跳转到班级详情
      wx.navigateTo({
        url: `/pages/teacher/class-details/class-details?classId=${classId}`
      });
    } else if (userInfo.role === 'student') {
      // 学生端跳转到课程签到统计页面
      wx.navigateTo({
        url: `/pages/student/course-statistics/course-statistics?courseId=${classId}&courseName=${encodeURIComponent(courseName)}`
      });
    }
  },

  /**
   * 去登录
   */
  goToLogin() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  }
});