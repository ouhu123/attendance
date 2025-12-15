package campusattendance.attendance_student.service;

import campusattendance.attendance_student.model.AttendanceSession;
import campusattendance.attendance_student.model.AttendanceRecord;

import java.util.List;
import java.util.Map;

/**
 * 签到服务接口
 */
public interface AttendanceService {
    /**
     * 教师发起签到
     * @param teacherId 教师ID
     * @param teacherNo 教师编号
     * @param courseName 课程名称
     * @param className 班级名称
     * @param longitude 经度
     * @param latitude 纬度
     * @param duration 签到时长(分钟)
     * @param attendanceType 签到方式(1:二维码签到,2:地理位置签到,3:九宫格签到)
     * @param radius 签到半径(米)
     * @return 包含会话信息和二维码的Map
     */
    Map<String, Object> initiateAttendance(Long teacherId, String teacherNo, String courseName, String className, Double longitude, Double latitude, Integer duration, Integer attendanceType, Integer radius, String gesture);

    /**
     * 学生扫码签到
     * @param tokenOrSessionCode 签到token或直接会话码
     * @param studentId 学生ID
     * @param studentNo 学生编号
     * @param studentName 学生姓名
     * @param longitude 经度
     * @param latitude 纬度
     * @param gesture 九宫格手势
     * @return 签到结果
     */
    Map<String, Object> scanAttendance(String tokenOrSessionCode, Long studentId, String studentNo, String studentName, Double longitude, Double latitude, String gesture);

    /**
     * 检查签到会话是否有效
     * @param sessionCode 会话码
     * @return 会话是否有效
     */
    boolean checkSessionValid(String sessionCode);

    /**
     * 获取教师最近签到记录
     * @param teacherId 教师ID
     * @return 最近签到记录列表
     */
    List<Map<String, Object>> getRecentAttendanceByTeacher(Long teacherId);
    
    /**
     * 获取教师全部签到记录
     * @param teacherId 教师ID
     * @return 全部签到记录列表
     */
    List<Map<String, Object>> getAllAttendanceByTeacher(Long teacherId);

    /**
     * 获取教师签到统计数据
     * @param teacherId 教师ID
     * @return 统计数据Map
     */
    Map<String, Object> getAttendanceStatsByTeacher(Long teacherId);

    /**
     * 获取学生当前进行中的签到
     * @param studentId 学生ID
     * @return 当前签到信息
     */
    Map<String, Object> getCurrentAttendanceByStudent(Long studentId);

    /**
     * 获取学生最近签到记录
     * @param studentId 学生ID
     * @return 最近签到记录列表
     */
    List<Map<String, Object>> getRecentAttendanceByStudent(Long studentId);

    /**
     * 获取学生签到统计数据
     * @param studentId 学生ID
     * @return 统计数据Map
     */
    Map<String, Object> getAttendanceStatsByStudent(Long studentId);

    /**
     * 获取学生签到记录
     * @param studentId 学生ID
     * @param year 年份
     * @param month 月份
     * @return 签到记录列表
     */
    List<Map<String, Object>> getAttendanceRecordsByStudent(Long studentId, Integer year, Integer month);
    
    /**
     * 获取学生某门课程的签到统计数据
     * @param studentId 学生ID
     * @param courseName 课程名称
     * @return 签到统计数据
     */
    Map<String, Object> getAttendanceStatsByStudentAndCourse(Long studentId, String courseName);

    /**
     * 结束签到
     * @param sessionCode 会话码
     * @return 结束结果
     */
    Map<String, Object> endAttendance(String sessionCode);

    /**
     * 获取教师的课程列表
     * @param teacherId 教师ID
     * @return 课程列表
     */
    List<String> getTeacherCourses(Long teacherId);

    /**
     * 获取教师的班级列表
     * @param teacherId 教师ID
     * @return 班级列表
     */
    List<String> getTeacherClasses(Long teacherId);

    /**
     * 获取签到会话状态
     * @param sessionCode 会话码
     * @return 包含签到人数、总人数和会话状态的Map
     */
    Map<String, Object> getAttendanceStatus(String sessionCode);

    /**
     * 刷新二维码
     * @param sessionCode 会话码
     * @return 新的二维码
     */
    Map<String, Object> refreshQRCode(String sessionCode);

    /**
     * 获取签到会话信息
     * @param sessionCode 会话码
     * @return 签到会话信息
     */
    Map<String, Object> getSessionInfo(String sessionCode);
    
    /**
     * 获取签到会话的学生详情
     * @param sessionId 会话ID
     * @return 包含正常签到和未签到学生列表的Map
     */
    Map<String, Object> getSessionStudentDetails(Long sessionId);
    
    /**
     * 更新学生签到状态
     * @param sessionId 会话ID
     * @param studentId 学生ID
     * @param status 状态（2:迟到, 3:请假）
     * @return 更新结果
     */
    Map<String, Object> updateStudentAttendanceStatus(Long sessionId, Long studentId, Integer status);
}