// pages/student/course-statistics/course-statistics.js
Page({
  data: {
    courseId: '',
    courseName: '',
    totalAttendance: 0, // 总签到次数
    presentCount: 0,    // 正常次数
    lateCount: 0,       // 迟到次数
    absentCount: 0,     // 缺勤次数
    leaveCount: 0,      // 请假次数
    attendancePercentage: 0 // 出勤率
  },

  onLoad: function(options) {
    // 获取从班级管理页面传递的参数
    console.log('页面传递参数:', options);
    
    // 获取课程名称（优先从courseName参数获取，兼容旧版的courseId参数）
    let courseName = options.courseName ? decodeURIComponent(options.courseName) : '';
    let courseId = options.courseId || '';
    
    // 如果没有直接传递courseName，则尝试从其他可能的参数名获取
    if (!courseName) {
      // 检查是否有其他可能的参数名
      courseName = options.name ? decodeURIComponent(options.name) : '未知课程';
    }
    
    // 将课程ID转换为数字类型（如果有）
    let numericCourseId = courseId ? Number(courseId) : null;
    
    this.setData({
      courseId: numericCourseId,
      courseName: courseName
    });
    
    console.log('处理后课程ID:', numericCourseId);
    console.log('处理后课程名称:', courseName);
    
    // 加载学生签到统计信息
    this.loadStudentAttendanceStatistics();
  },

  // 加载学生签到统计信息
  loadStudentAttendanceStatistics: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    const courseName = this.data.courseName;
    
    console.log('用户信息:', userInfo);
    console.log('Token:', token);
    console.log('课程名称:', courseName);
    
    // 确保用户信息存在
    if (!userInfo) {
      wx.showToast({
        title: '用户信息获取失败',
        icon: 'none'
      });
      return;
    }
    
    // 获取学生ID，处理可能的不同字段名
    const studentId = userInfo.id || userInfo.userId || userInfo.studentId;
    if (!studentId) {
      wx.showToast({
        title: '学生ID获取失败',
        icon: 'none'
      });
      return;
    }
    
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    // 确保课程名称有效
    if (!courseName || courseName === '未知课程') {
      console.warn('课程名称无效，仍尝试获取统计数据');
      // 不中断，仍尝试获取统计数据
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '加载签到统计...',
    });
    
    // 调用后端API获取学生某门课程的签到统计数据
    wx.request({
      url: 'http://localhost:8090/api/attendance/student/my-course-statistics',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        studentId: studentId,  // 学生ID
        courseName: courseName // 课程名称
      },
      success: (res) => {
        console.log('签到统计API返回完整数据:', res);
        
        if (res.statusCode === 200) {
          if (res.data && res.data.code === 200) {
            const statistics = res.data.data || {};
            console.log('签到统计信息:', statistics);
            
            // 将出勤率字符串转换为数字（如 "95.5%" -> 95.5）
            let attendanceRate = 0;
            if (statistics.attendanceRate) {
              attendanceRate = parseFloat(statistics.attendanceRate) || 0;
            }
            
            // 更新页面数据
            this.setData({
              totalAttendance: statistics.totalCount || 0,
              presentCount: statistics.attendanceCount || 0,
              lateCount: statistics.lateCount || 0,
              leaveCount: statistics.leaveCount || 0,
              absentCount: statistics.absentCount || 0,
              attendancePercentage: attendanceRate
            });
          } else {
            wx.showToast({
              title: res.data.message || '获取签到统计失败',
              icon: 'none'
            });
            console.error('API返回错误:', res.data.message);
          }
        } else {
          wx.showToast({
            title: '服务器错误: ' + res.statusCode,
            icon: 'none'
          });
          console.error('HTTP错误:', res.statusCode);
        }
      },
      fail: (err) => {
        console.error('获取签到统计失败:', err);
        wx.showToast({
          title: '网络错误，请检查连接',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});