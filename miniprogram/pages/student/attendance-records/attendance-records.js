// 学生签到记录页面逻辑
Page({
  data: {
    attendanceRecords: [],
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear()
  },

  onLoad: function() {
    // 加载当前月份的签到记录
    this.loadAttendanceRecords();
  },

  // 加载签到记录
  loadAttendanceRecords: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    // 确保用户信息存在且属性完整
    if (!userInfo || !userInfo.userId) {
      return;
    }
    
    // 这里应该调用实际的API获取签到记录
    // 暂时使用模拟数据
    wx.request({
      url: 'http://localhost:8090/api/attendance/student/records',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        studentId: userInfo.userId,
        studentNo: userInfo.username || '',
        year: this.data.currentYear,
        month: this.data.currentMonth
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            attendanceRecords: res.data.data
          });
        }
      },
      fail: () => {
        // 网络请求失败，使用模拟数据
        this.setData({
          attendanceRecords: [
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
      }
    });
  },

  // 上一月
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
    this.loadAttendanceRecords();
  },

  // 下一月
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
    this.loadAttendanceRecords();
  },

  // 返回首页
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 跳转到个人中心
  goToProfile: function() {
    wx.navigateTo({
      url: '../profile/profile'
    });
  },

  // 退出登录
  logout: function() {
    // 显示确认对话框
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息和token
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          // 跳转到登录页面
          wx.redirectTo({
            url: '../../index/index'
          });
        }
      }
    });
  }
});