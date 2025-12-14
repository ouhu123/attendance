// 签到记录页面逻辑
Page({
  data: {
    records: [],
    filteredRecords: [],
    filter: {
      courseName: '',
      grade: ''
    }
  },

  onLoad: function() {
    // 页面加载时获取全部签到记录
    this.loadAllAttendanceRecords();
  },

  onPullDownRefresh: function() {
    // 下拉刷新时重新加载数据
    this.loadAllAttendanceRecords();
    wx.stopPullDownRefresh();
  },

  // 加载全部签到记录
  loadAllAttendanceRecords: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
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
        teacherId: userInfo.userId
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            records: res.data.data,
            filteredRecords: res.data.data
          });
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取签到记录失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 筛选条件变化处理
  onFilterChange: function(e) {
    const { filter } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`filter.${filter}`]: value
    });
    
    // 应用筛选
    this.applyFilters();
  },



  // 应用筛选条件
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

  // 查看记录详情
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
      url: '/pages/teacher/attendance-detail/attendance-detail?sessionId=' + id,
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
  }
});