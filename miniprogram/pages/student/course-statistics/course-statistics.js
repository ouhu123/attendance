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
    attendancePercentage: 0, // 出勤率
    chartContext: null,  // Canvas上下文
    chartWidth: 0,      // Canvas宽度
    chartHeight: 0      // Canvas高度
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
            
            // 初始化并绘制圆环图
            this.initChart();
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
  },
  
  // 初始化圆环图
  initChart: function() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#attendance-chart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        // 确保画布有足够大的实际像素尺寸
        const width = res[0].width;
        const height = res[0].height;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        
        // 保存上下文和尺寸
        this.setData({
          chartContext: ctx,
          chartWidth: width,
          chartHeight: height
        });
        
        // 绘制圆环图
        this.drawChart();
      });
  },
  
  // 绘制饼图 - 确保在统一卡片中居中显示
  drawChart: function() {
    const { chartContext, chartWidth, chartHeight, 
            presentCount, lateCount, absentCount, leaveCount } = this.data;
    
    if (!chartContext) return;
    
    // 清空画布
    chartContext.clearRect(0, 0, chartWidth, chartHeight);
    
    // 计算总数
    const total = presentCount + lateCount + absentCount + leaveCount;
    if (total === 0) {
      // 如果没有数据，显示空状态
      this.drawEmptyChart();
      return;
    }
    
    // 饼图参数 - 调整饼图位置，为标签留出更多空间
    const centerX = chartWidth / 2;
    const centerY = chartHeight * 0.35; // 饼图上移，为下方标签留出更多空间
    const radius = Math.min(chartWidth, chartHeight) * 0.25; // 减小饼图尺寸，确保所有内容都能显示
    
    // 数据和颜色
    const data = [
      { value: presentCount, color: '#34A853', label: '正常签到' }, // 绿色
      { value: lateCount, color: '#FBBC05', label: '迟到' },    // 黄色
      { value: leaveCount, color: '#4285F4', label: '请假' },     // 蓝色
      { value: absentCount, color: '#EA4335', label: '缺勤' }  // 红色
    ];
    
    // 绘制饼图
    let currentAngle = -Math.PI / 2; // 从顶部开始
    
    // 绘制饼图扇形
    data.forEach((item) => {
      if (item.value === 0) return;
      
      const angle = (item.value / total) * Math.PI * 2;
      
      chartContext.beginPath();
      chartContext.moveTo(centerX, centerY);
      chartContext.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
      chartContext.closePath();
      
      chartContext.fillStyle = item.color;
      chartContext.fill();
      
      currentAngle += angle;
    });
    
    // 绘制饼图边框
    chartContext.beginPath();
    chartContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    chartContext.strokeStyle = '#ffffff';
    chartContext.lineWidth = 3;
    chartContext.stroke();
    
    // 绘制标签 - 饼图下方完整显示所有标签
    chartContext.save();
    
    // 设置文字样式，确保清晰可读
    chartContext.font = 'bold 12px Arial';
    chartContext.fillStyle = '#333333';
    chartContext.textBaseline = 'middle';
    chartContext.textAlign = 'left';
    
    // 所有标签数据
    const labels = [
      { text: `正常签到: ${presentCount}`, color: '#34A853' },
      { text: `迟到: ${lateCount}`, color: '#FBBC05' },
      { text: `请假: ${leaveCount}`, color: '#4285F4' },
      { text: `缺勤: ${absentCount}`, color: '#EA4335' }
    ];
    
    // 计算标签起始位置和间距，确保所有标签都能显示
    const labelStartY = centerY + radius + 30;
    const labelSpacing = 35;
    const labelLeftMargin = 50; // 左侧边距
    
    // 绘制所有标签，使用颜色方块标识
    labels.forEach((label, index) => {
      const y = labelStartY + (index * labelSpacing);
      const x = labelLeftMargin;
      
      // 绘制颜色方块
      chartContext.fillStyle = label.color;
      chartContext.fillRect(x, y - 8, 14, 14);
      
      // 绘制文字
      chartContext.fillStyle = '#333333';
      chartContext.fillText(label.text, x + 22, y);
    });
    
    chartContext.restore();
  },
  
  // 绘制空状态图表
  drawEmptyChart: function() {
    const { chartContext, chartWidth, chartHeight } = this.data;
    
    if (!chartContext) return;
    
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const innerRadius = radius * 0.6;
    
    // 绘制空圆环
    chartContext.beginPath();
    chartContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    chartContext.arc(centerX, centerY, innerRadius, Math.PI * 2, 0, true);
    chartContext.closePath();
    
    // 设置空状态颜色
    const gradient = chartContext.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(200, 200, 200, 0.2)');
    gradient.addColorStop(1, 'rgba(200, 200, 200, 0.1)');
    chartContext.fillStyle = gradient;
    chartContext.fill();
    
    // 绘制内圆背景
    chartContext.beginPath();
    chartContext.arc(centerX, centerY, innerRadius - 5, 0, Math.PI * 2);
    const innerGradient = chartContext.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, innerRadius
    );
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    innerGradient.addColorStop(1, 'rgba(240, 248, 255, 0.95)');
    chartContext.fillStyle = innerGradient;
    chartContext.fill();
    
    // 绘制空状态文字
    chartContext.font = '24rpx sans-serif';
    chartContext.fillStyle = '#999';
    chartContext.textAlign = 'center';
    chartContext.textBaseline = 'middle';
    chartContext.fillText('暂无签到数据', centerX, centerY);
  },
  
  // 调整颜色亮度
  adjustColor: function(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
});