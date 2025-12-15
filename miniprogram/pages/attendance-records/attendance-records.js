// 共用签到记录页面逻辑 - 根据用户角色加载不同的签到记录数据
Page({
  data: {
    userInfo: {},
    records: [],
    filteredRecords: [],
    loading: true,
    filter: {
      courseName: '',
      grade: ''
    },
    // 学生端月份选择
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear()

  },

  onLoad: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
      
      // 根据用户角色加载不同的数据
      if (userInfo.role === 'teacher') {
        this.loadTeacherRecords();
      } else if (userInfo.role === 'student') {
        this.loadStudentRecords();
      }
    } else {
      // 未登录，跳转回登录页
      wx.redirectTo({
        url: '../index/index'
      });
    }
  },

  onShow: function() {
    // 页面显示时重新加载数据
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        loading: true
      });
      
      // 根据用户角色加载不同的数据
      if (userInfo.role === 'teacher') {
        this.loadTeacherRecords();
      } else if (userInfo.role === 'student') {
        this.loadStudentRecords();
      }
    }
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      loading: true
    });
    
    // 根据用户角色重新加载数据
    const userInfo = this.data.userInfo;
    if (userInfo.role === 'teacher') {
      this.loadTeacherRecords();
    } else if (userInfo.role === 'student') {
      this.loadStudentRecords();
    }
  },

  // 教师端：加载签到记录
  loadTeacherRecords: function() {
    // 获取token
    const token = wx.getStorageSync('token');
    const userInfo = this.data.userInfo;
    
    wx.showLoading({
      title: '加载中...'
    });
    
    wx.request({
      url: 'http://localhost:8090/api/attendance/teacher/records',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        teacherId: Number(userInfo.userId)
      },
      success: (res) => {
        if (res.data.code === 200) {
          // 处理数据，格式化时间等
          const formattedRecords = res.data.data.map(item => {
            return {
              ...item,
              attendanceTime: this.formatDateTime(item.date),
              attendedCount: item.attendanceCount || 0
            };
          });
          
          this.setData({
            records: formattedRecords,
            filteredRecords: formattedRecords
          });
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('加载签到记录失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({
          loading: false
        });
        wx.hideLoading();
        wx.stopPullDownRefresh();
      }
    });
  },

  // 学生端：加载签到记录
  loadStudentRecords: function() {
    // 获取token
    const token = wx.getStorageSync('token');
    const userInfo = this.data.userInfo;
    
    // 获取当前月份信息，确保year和month始终有值
    const now = new Date();
    const year = this.data.currentYear || now.getFullYear();
    const month = this.data.currentMonth || (now.getMonth() + 1);
    
    wx.showLoading({
      title: '加载中...'
    });
    
    wx.request({
      url: 'http://localhost:8090/api/attendance/student/records',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        studentId: Number(userInfo.userId),
        studentNo: userInfo.username || '',
        year: year,
        month: month
      },
      success: (res) => {
        if (res.data.code === 200) {
          // 处理数据，格式化时间等
          const formattedRecords = res.data.data.map(item => {
            return {
              ...item,
              signTime: item.signTime ? this.formatDateTime(item.signTime) : ''
            };
          });
          
          this.setData({
            records: formattedRecords
          });
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('加载签到记录失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        // 网络请求失败，使用模拟数据
        this.setData({
          records: [
            {
              id: 1,
              date: '2025-12-12',
              courseName: '计算机网络',
              status: '正常',
              signTime: '14:35'
            },
            {
              id: 2,
              date: '2025-12-11',
              courseName: '软件工程',
              status: '正常',
              signTime: '09:10'
            },
            {
              id: 3,
              date: '2025-12-10',
              courseName: '数据库原理',
              status: '正常',
              signTime: '16:20'
            },
            {
              id: 4,
              date: '2025-12-09',
              courseName: '操作系统',
              status: '迟到',
              signTime: '09:05'
            },
            {
              id: 5,
              date: '2025-12-08',
              courseName: '高等数学',
              status: '正常',
              signTime: '13:25'
            },
            {
              id: 6,
              date: '2025-12-05',
              courseName: '计算机网络',
              status: '正常',
              signTime: '14:30'
            }
          ]
        });
      },
      complete: () => {
        this.setData({
          loading: false
        });
        wx.hideLoading();
        wx.stopPullDownRefresh();
      }
    });
  },

  // 教师端：筛选条件变化处理
  onFilterChange: function(e) {
    const { filter } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`filter.${filter}`]: value
    });
    
    // 应用筛选
    this.applyFilters();
  },

  // 教师端：应用筛选条件
  applyFilters: function() {
    const { records, filter } = this.data;
    let filtered = records;
    
    // 课程名称筛选
    if (filter.courseName) {
      filtered = filtered.filter(record => 
        record.courseName.includes(filter.courseName)
      );
    }
    
    // 年级筛选
    if (filter.grade) {
      filtered = filtered.filter(record => 
        record.grade.includes(filter.grade)
      );
    }
    
    this.setData({
      filteredRecords: filtered
    });
  },

  // 教师端：查看签到详情
  viewRecordDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      wx.showToast({
        title: '签到信息不完整',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    wx.navigateTo({
      url: '../teacher/attendance-detail/attendance-detail?sessionId=' + id,
      success: function() {
        console.log('页面跳转成功');
      },
      fail: function(err) {
        console.error('页面跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },



  // 学生端：上一月
  prevMonth: function() {
    let year = this.data.currentYear;
    let month = this.data.currentMonth;
    
    if (month === 1) {
      year--;
      month = 12;
    } else {
      month--;
    }
    
    this.setData({
      currentYear: year,
      currentMonth: month
    });
    
    // 重新加载数据
    this.loadStudentRecords();
  },

  // 学生端：下一月
  nextMonth: function() {
    let year = this.data.currentYear;
    let month = this.data.currentMonth;
    
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
    
    this.setData({
      currentYear: year,
      currentMonth: month
    });
    
    // 重新加载数据
    this.loadStudentRecords();
  },

  // 格式化日期时间
  formatDateTime: function(dateTimeString) {
    if (!dateTimeString) return '';
    
    // 尝试创建日期对象
    const date = new Date(dateTimeString);
    
    // 检查是否是有效日期
    if (isNaN(date.getTime())) {
      // 如果是字符串且包含小时和分钟信息，尝试手动解析
      if (typeof dateTimeString === 'string') {
        // 处理常见的时间格式，如 "HH:mm" 或 "HH:mm:ss"
        const timeMatch = dateTimeString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (timeMatch) {
          const [, hour, minute, second] = timeMatch;
          return `${hour}:${minute}`;
        }
      }
      return '';
    }
    
    // 有效日期，格式化显示
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
});