// pages/teacher/attendance-detail/attendance-detail.js
Page({
  data: {
    sessionId: null,
    sessionInfo: null,
    attendedStudents: [],
    absentStudents: []
  },

  onLoad: function(options) {
    if (options.sessionId) {
      this.setData({
        sessionId: options.sessionId
      });
      this.loadAttendanceDetail(options.sessionId);
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

  // 加载签到详情
  loadAttendanceDetail: function(sessionId) {
    const token = wx.getStorageSync('token');
    
    wx.showLoading({
      title: '加载中...'
    });
    
    wx.request({
      url: 'http://localhost:8090/api/attendance/session/' + sessionId + '/students',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        wx.hideLoading();
        console.log('获取签到详情响应:', res);
        if (res.data.code === 200) {
          const data = res.data.data;
          console.log('签到详情数据:', data);
          
          // 格式化时间
          const formatDateTime = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            const date = new Date(dateTimeStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          };
          
          // 格式化签到时间
          const formatSignTime = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            const date = new Date(dateTimeStr);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
          };
          
          // 处理正常签到学生
          const attendedStudents = (data.attendedStudents || []).map(student => ({
            ...student,
            signTime: formatSignTime(student.signTime)
          }));
          
          this.setData({
            sessionInfo: {
              courseName: data.courseName,
              className: data.className,
              startTime: formatDateTime(data.startTime),
              endTime: formatDateTime(data.endTime)
            },
            attendedStudents: attendedStudents,
            absentStudents: data.absentStudents || []
          });
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('加载签到详情失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },
  
  // 标记为迟到
  markAsLate: function(e) {
    const studentId = e.currentTarget.dataset.studentId;
    this.updateStudentStatus(studentId, 2, '迟到');
  },
  
  // 标记为请假
  markAsLeave: function(e) {
    const studentId = e.currentTarget.dataset.studentId;
    this.updateStudentStatus(studentId, 3, '请假');
  },
  
  // 更新学生状态
  updateStudentStatus: function(studentId, status, statusText) {
    const sessionId = this.data.sessionId;
    const token = wx.getStorageSync('token');
    
    wx.showLoading({
      title: '处理中...'
    });
    
    wx.request({
      url: `http://localhost:8090/api/attendance/session/${sessionId}/student/${studentId}/status?status=${status}`,
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        wx.hideLoading();
        console.log('更新状态响应:', res);
        if (res.data.code === 200) {
          wx.showToast({
            title: res.data.message || '操作成功',
            icon: 'success',
            duration: 2000
          });
          
          // 更新本地数据
          const absentStudents = this.data.absentStudents.map(student => {
            if (student.studentId === studentId) {
              return {
                ...student,
                status: statusText
              };
            }
            return student;
          });
          
          this.setData({
            absentStudents: absentStudents
          });
          
          // 如果状态变为迟到或请假，从未签到列表移除，添加到对应的列表
          // 这里可以根据需要调整，或者重新加载数据
          setTimeout(() => {
            this.loadAttendanceDetail(sessionId);
          }, 1000);
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('更新状态失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
});

