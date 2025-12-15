Page({
  data: {
    userInfo: {},

    // 教师端
    recentAttendances: [],
    stats: {},

    // 学生端
    currentAttendance: null,
    countdownTime: null, // 倒计时时间（秒）
    countdownTimer: null, // 倒计时定时器

    // 手势签到
    showGestureModal: false,
    currentSessionCode: '',
    gesturePoints: [
      { id: 1, top: 16.67, left: 16.67 },
      { id: 2, top: 16.67, left: 50 },
      { id: 3, top: 16.67, left: 83.33 },
      { id: 4, top: 50, left: 16.67 },
      { id: 5, top: 50, left: 50 },
      { id: 6, top: 50, left: 83.33 },
      { id: 7, top: 83.33, left: 16.67 },
      { id: 8, top: 83.33, left: 50 },
      { id: 9, top: 83.33, left: 83.33 }
    ],
    currentPoints: [],
    gesture: '',
    gestureCanvasContext: null,
    gestureGridRect: null
  },

  /* ================= 生命周期 ================= */

  onLoad() {
    this.initUser();
  },

  onShow() {
    this.initUser();
  },

  /* ================= 初始化 ================= */

  initUser() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return;

    this.setData({ userInfo });

    if (userInfo.role === 'teacher') {
      this.loadTeacherData();
    } else if (userInfo.role === 'student') {
      this.loadStudentData();
    }
  },

  /* ================= 教师 ================= */

  loadTeacherData() {
    this.loadRecentAttendances();
    this.loadStatistics();
  },

  loadRecentAttendances() {
    const token = wx.getStorageSync('token');
    const userInfo = this.data.userInfo;

    wx.request({
      url: 'http://localhost:8090/api/attendance/teacher/recent',
      header: {
        Authorization: `Bearer ${token}`
      },
      data: {
        teacherId: userInfo.userId
      },
      success: res => {
        if (res.data.code === 200) {
          const recentAttendances = res.data.data || [];
          // 为进行中的签到设置倒计时
          this.startCountdownForAttendances(recentAttendances);
          this.setData({
            recentAttendances: recentAttendances
          });
        }
      }
    });
  },

  loadStatistics() {
    const token = wx.getStorageSync('token');
    const userInfo = this.data.userInfo;

    wx.request({
      url: 'http://localhost:8090/api/attendance/teacher/stats',
      header: {
        Authorization: `Bearer ${token}`
      },
      data: {
        teacherId: userInfo.userId
      },
      success: res => {
        if (res.data.code === 200) {
          this.setData({ stats: res.data.data });
        }
      }
    });
  },

  /**
   * 为进行中的签到设置倒计时
   */
  startCountdownForAttendances(attendances) {
    // 清除之前的所有定时器
    this.clearAllCountdowns();
    
    attendances.forEach((attendance, index) => {
      if (attendance.status === '进行中' && attendance.remainingSeconds > 0) {
        this.updateCountdownDisplay(attendance);
        // 设置定时器更新倒计时
        attendance.countdownTimer = setInterval(() => {
          this.updateCountdownTimer(attendance, index);
        }, 1000);
      }
    });
  },

  /**
   * 更新倒计时显示
   */
  updateCountdownDisplay(attendance) {
    const minutes = Math.floor(attendance.remainingSeconds / 60);
    const seconds = attendance.remainingSeconds % 60;
    attendance.countdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * 更新倒计时定时器
   */
  updateCountdownTimer(attendance, index) {
    if (attendance.remainingSeconds > 0) {
      attendance.remainingSeconds--;
      this.updateCountdownDisplay(attendance);
      // 更新页面数据
      const recentAttendances = [...this.data.recentAttendances];
      recentAttendances[index] = attendance;
      this.setData({ recentAttendances });
    } else {
      // 倒计时结束，清除定时器
      clearInterval(attendance.countdownTimer);
      attendance.countdownTimer = null;
      // 更新状态为已结束
      attendance.status = '已结束';
      const recentAttendances = [...this.data.recentAttendances];
      recentAttendances[index] = attendance;
      this.setData({ recentAttendances });
    }
  },

  /**
   * 清除所有倒计时定时器
   */
  clearAllCountdowns() {
    if (this.data.recentAttendances) {
      this.data.recentAttendances.forEach(attendance => {
        if (attendance.countdownTimer) {
          clearInterval(attendance.countdownTimer);
          attendance.countdownTimer = null;
        }
      });
    }
  },

  /* ================= 学生 ================= */

  loadStudentData() {
    this.loadCurrentAttendance();
  },

  loadCurrentAttendance() {
    const token = wx.getStorageSync('token');
    const userInfo = this.data.userInfo;

    wx.request({
      url: 'http://localhost:8090/api/attendance/student/my-current',
      header: { Authorization: `Bearer ${token}` },
      data: {
        studentId: userInfo.userId
      },
      success: res => {
        if (res.data.code === 200) {
          let attendance = res.data.data;
          
          // 处理没有当前签到的情况
          if (!attendance) {
            this.setData({ currentAttendance: null });
            this.setData({ countdownTime: null });
            return;
          }
          
          // 将数字状态转换为文字描述
          if (attendance.status !== undefined) {
            switch(Number(attendance.status)) {
              case 1:
                attendance.status = '进行中';
                break;
              case 2:
                attendance.status = '已结束';
                break;
              default:
                attendance.status = '未知状态';
            }
          }
          
          this.setData({ currentAttendance: attendance });
          
          // 启动倒计时（如果是进行中的签到）
          this.startCountdown(attendance);
        }
      }
    });
  },



  /* ================= 倒计时功能 ================= */
  
  // 启动倒计时
  startCountdown(attendance) {
    // 清除之前的定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
    
    // 只有进行中的签到才需要倒计时
    if (attendance.status !== '进行中') {
      this.setData({ countdownTime: null });
      return;
    }
    
    // 计算剩余时间（假设后端返回了endTime或duration字段）
    let remainingSeconds = 0;
    
    if (attendance.endTime) {
      // 如果有结束时间，计算距离结束时间的剩余秒数
      const endTimeMs = new Date(attendance.endTime).getTime();
      const nowMs = Date.now();
      remainingSeconds = Math.max(0, Math.floor((endTimeMs - nowMs) / 1000));
    } else if (attendance.duration) {
      // 如果有持续时间（分钟），计算剩余秒数
      remainingSeconds = attendance.duration * 60;
    }
    
    this.setData({ countdownTime: remainingSeconds });
    
    // 启动定时器
    if (remainingSeconds > 0) {
      const timer = setInterval(() => {
        this.updateCountdown();
      }, 1000);
      
      this.setData({ countdownTimer: timer });
    }
  },
  
  // 更新倒计时
  updateCountdown() {
    const currentTime = this.data.countdownTime;
    if (currentTime === null || currentTime <= 0) {
      // 倒计时结束
      clearInterval(this.data.countdownTimer);
      this.setData({ 
        countdownTime: 0,
        countdownTimer: null
      });
      // 可以选择重新加载当前签到状态
      this.loadCurrentAttendance();
      return;
    }
    
    // 更新剩余时间
    this.setData({ countdownTime: currentTime - 1 });
  },
  
  // 格式化时间为 mm:ss 格式
  formatTime(seconds) {
    if (seconds <= 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  },
  
  /* ================= 生命周期方法 ================= */
  
  onUnload() {
    // 页面卸载时清除定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
  },
  
  onHide() {
    // 页面隐藏时清除定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
      this.setData({ countdownTimer: null });
    }
  },
  
  onShow() {
    // 页面显示时重新初始化并加载数据
    this.initUser();
    // 如果有进行中的签到，重新启动倒计时
    const { currentAttendance } = this.data;
    if (currentAttendance && currentAttendance.status === '进行中') {
      this.startCountdown(currentAttendance);
    }
  },
  
  /* ================= ✅ 唯一用户签到入口 ================= */

  onUserClickSign() {
    const { userInfo, currentAttendance } = this.data;

    if (userInfo.role !== 'student') return;

    if (!currentAttendance) {
      wx.showToast({ title: '当前没有进行中的签到', icon: 'none' });
      return;
    }

    this.directSignIn(true); // ⭐ 关键
  },

  /* ================= 业务分发 ================= */

  directSignIn(isFromUserClick = false) {
    const attendance = this.data.currentAttendance;
    if (!attendance) return;

    const type = Number(attendance.attendanceType);
    const sessionCode = attendance.sessionCode;

    if (type === 1) {
      wx.navigateTo({ url: '/pages/student/sign/sign' });
      return;
    }

    if (type === 2) {
      wx.navigateTo({
        url: `/pages/student/location-sign/location-sign?sessionCode=${sessionCode}`
      });
      return;
    }

    if (type === 3) {
      if (!isFromUserClick) return;

      this.setData({
        showGestureModal: true,
        currentSessionCode: sessionCode
      });

      setTimeout(() => this.initGestureCanvas(), 100);
    }
  },

  /* ================= 手势 ================= */

  initGestureCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#gesture-canvas-student')
      .fields({ node: true, size: true })
      .exec(res => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;

        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        this.setData({
          gestureCanvasContext: ctx,
          gestureGridRect: { width: res[0].width, height: res[0].height }
        });
      });
  },

  onGestureStart() {
    const { gestureCanvasContext, gestureGridRect } = this.data;
    gestureCanvasContext &&
      gestureCanvasContext.clearRect(0, 0, gestureGridRect.width, gestureGridRect.height);

    this.setData({ currentPoints: [], gesture: '' });
  },

  onGestureMove(e) {
    const { clientX, clientY } = e.touches[0];
    const { gesturePoints, currentPoints, gestureCanvasContext, gestureGridRect } = this.data;

    const query = wx.createSelectorQuery();
    query.select('.gesture-grid-student').boundingClientRect().exec(res => {
      if (!res[0]) return;
      const grid = res[0];
      let shouldUpdate = false;
      let newCurrentPoints = [...currentPoints];
      let newGesture = this.data.gesture;

      gesturePoints.forEach(p => {
        if (newCurrentPoints.find(cp => cp.id === p.id)) return;

        const x = grid.left + grid.width * p.left / 100;
        const y = grid.top + grid.height * p.top / 100;

        if (Math.hypot(clientX - x, clientY - y) < 60) {
          newCurrentPoints.push(p);
          newGesture += p.id;
          shouldUpdate = true;
        }
      });

      if (shouldUpdate) {
        this.setData({
          currentPoints: newCurrentPoints,
          gesture: newGesture
        });

        // 绘制连线
        if (gestureCanvasContext && gestureGridRect) {
          this.drawGestureLines(grid);
        }
      }
    });
  },

  onGestureEnd() {
    // 手势绘制结束，不做额外处理，保持绘制结果
  },

  drawGestureLines(grid) {
    const { gestureCanvasContext, currentPoints, gesturePoints } = this.data;
    if (!gestureCanvasContext || currentPoints.length < 2) return;

    // 清空画布
    const gridRect = this.data.gestureGridRect;
    gestureCanvasContext.clearRect(0, 0, gridRect.width, gridRect.height);

    // 绘制所有已选点
    currentPoints.forEach(p => {
      const targetPoint = gesturePoints.find(point => point.id === p.id);
      if (targetPoint) {
        const x = grid.width * targetPoint.left / 100;
        const y = grid.height * targetPoint.top / 100;
        this.drawPoint(x, y);
      }
    });

    // 绘制连线
    gestureCanvasContext.beginPath();
    gestureCanvasContext.strokeStyle = '#1A73E8';
    gestureCanvasContext.lineWidth = 8;
    gestureCanvasContext.lineCap = 'round';
    gestureCanvasContext.lineJoin = 'round';

    for (let i = 0; i < currentPoints.length; i++) {
      const p = currentPoints[i];
      const targetPoint = gesturePoints.find(point => point.id === p.id);
      if (!targetPoint) continue;

      const x = grid.width * targetPoint.left / 100;
      const y = grid.height * targetPoint.top / 100;

      if (i === 0) {
        gestureCanvasContext.moveTo(x, y);
      } else {
        gestureCanvasContext.lineTo(x, y);
      }
    }

    gestureCanvasContext.stroke();
  },

  drawPoint(x, y) {
    const { gestureCanvasContext } = this.data;
    if (!gestureCanvasContext) return;

    // 绘制外圈
    gestureCanvasContext.beginPath();
    gestureCanvasContext.arc(x, y, 16, 0, Math.PI * 2);
    gestureCanvasContext.fillStyle = '#1A73E8';
    gestureCanvasContext.fill();

    // 绘制内圈
    gestureCanvasContext.beginPath();
    gestureCanvasContext.arc(x, y, 8, 0, Math.PI * 2);
    gestureCanvasContext.fillStyle = '#ffffff';
    gestureCanvasContext.fill();
  },

  // 重置手势
  resetGesture() {
    const { gestureCanvasContext, gestureGridRect } = this.data;
    // 清除画布
    if (gestureCanvasContext && gestureGridRect) {
      gestureCanvasContext.clearRect(0, 0, gestureGridRect.width, gestureGridRect.height);
    }
    // 重置当前选中的点和手势
    this.setData({
      currentPoints: [],
      gesture: ''
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空方法，用于阻止点击事件冒泡到父元素
  },

  confirmGestureSign() {
    if (!this.data.gesture) {
      wx.showToast({ title: '请绘制手势', icon: 'none' });
      return;
    }

    const token = wx.getStorageSync('token');
    const userInfo = this.data.userInfo;

    wx.request({
      url: 'http://localhost:8090/api/attendance/student/sign',
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      data: {
        sessionCode: this.data.currentSessionCode,
        studentId: userInfo.userId,
        studentNo: userInfo.username,
        gesture: this.data.gesture
      },
      success: res => {
        if (res.data.code === 200) {
          wx.showToast({ title: '签到成功', icon: 'success' });
          this.hideGestureModal();
          this.loadStudentData();
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' });
        }
      }
    });
  },

  hideGestureModal() {
    this.setData({
      showGestureModal: false,
      currentPoints: [],
      gesture: ''
    });
  },

  /* ================= 教师端操作方法 ================= */

  // 发起签到
  initiateAttendance() {
    wx.navigateTo({
      url: '/pages/teacher/initiate-attendance/initiate-attendance'
    });
  },

  // 查看签到详情
  viewAttendanceDetail(e) {
    const attendanceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/teacher/attendance-detail/attendance-detail?id=${attendanceId}`
    });
  },

  /* ================= 通用方法 ================= */

  // 跳转到个人中心
  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  },

  // 退出登录
  logout() {
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 学生端扫码签到
  goToSign() {
    wx.navigateTo({
      url: '/pages/student/sign/sign'
    });
  },

  // 学生端位置签到
  goToLocationSign() {
    wx.navigateTo({
      url: '/pages/student/location-sign/location-sign'
    });
  }
});
