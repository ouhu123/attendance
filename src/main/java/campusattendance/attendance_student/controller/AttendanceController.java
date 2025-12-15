package campusattendance.attendance_student.controller;

import campusattendance.attendance_student.dto.InitiateAttendanceDTO;
import campusattendance.attendance_student.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;


import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 签到控制器
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    /**
     * 教师发起签到
     * @param initiateAttendanceDTO 签到请求参数，包含教师ID、教师编号、课程名称、班级名称、经纬度、签到时长、签到类型和签到半径等信息
     * @return 签到信息，包含会话码、二维码等数据
     */

    @PostMapping("/initiate")
    public Map<String, Object> initiateAttendance(
            @RequestBody InitiateAttendanceDTO initiateAttendanceDTO) {
        Long teacherId = initiateAttendanceDTO.getTeacherId();
        String teacherNo = initiateAttendanceDTO.getTeacherNo();
        String courseName = initiateAttendanceDTO.getCourseName();
        String className = initiateAttendanceDTO.getClassName();
        Double longitude = initiateAttendanceDTO.getLongitude();
        Double latitude = initiateAttendanceDTO.getLatitude();
        Integer duration = initiateAttendanceDTO.getDuration();
        Integer attendanceType = initiateAttendanceDTO.getAttendanceType();
        Integer radius = initiateAttendanceDTO.getRadius();
        String gesture = initiateAttendanceDTO.getGesture();
        Map<String, Object> data = attendanceService.initiateAttendance(teacherId, teacherNo, courseName, className, longitude, latitude, duration, attendanceType, radius, gesture);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "发起签到成功");
        result.put("data", data);
        return result;
    }

    /**
     * 学生扫码签到
     * @param sessionCode 会话码
     * @param studentId 学生ID
     * @param studentNo 学生编号
     * @param studentName 学生姓名
     * @param longitude 经度
     * @param latitude 纬度
     * @param gesture 九宫格手势（可选）
     * @return 签到结果
     */
    @PostMapping("/scan")
    public Map<String, Object> scanAttendance(
            @RequestParam String sessionCode,
            @RequestParam Long studentId,
            @RequestParam String studentNo,
            @RequestParam String studentName,
            @RequestParam Double longitude,
            @RequestParam Double latitude,
            @RequestParam(required = false) String gesture) {
        return attendanceService.scanAttendance(sessionCode, studentId, studentNo, studentName, longitude, latitude, gesture);
    }

    /**
     * 获取教师最近签到记录
     * @param teacherId 教师ID
     * @return 签到记录列表
     */
    @GetMapping("/teacher/recent")
    public Map<String, Object> getRecentAttendanceByTeacher(@RequestParam Long teacherId) {
        List<Map<String, Object>> recentAttendance = attendanceService.getRecentAttendanceByTeacher(teacherId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", recentAttendance);
        return result;
    }
    
    /**
     * 获取教师全部签到记录
     * @param teacherId 教师ID
     * @return 全部签到记录列表
     */
    @GetMapping("/teacher/records")
    public Map<String, Object> getAllAttendanceByTeacher(@RequestParam Long teacherId) {
        List<Map<String, Object>> allAttendance = attendanceService.getAllAttendanceByTeacher(teacherId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", allAttendance);
        return result;
    }

    /**
     * 获取教师签到统计数据
     * @param teacherId 教师ID
     * @return 统计数据
     */
    @GetMapping({"/teacher/stats", "/teacher/statistics"})
    public Map<String, Object> getAttendanceStatsByTeacher(@RequestParam Long teacherId) {
        Map<String, Object> stats = attendanceService.getAttendanceStatsByTeacher(teacherId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", stats);
        return result;
    }
    
    /**
     * 获取学生最近签到记录
     * @param studentId 学生ID
     * @return 签到记录列表
     */
    @GetMapping("/student/recent")
    public Map<String, Object> getRecentAttendanceByStudent(@RequestParam Long studentId) {
        List<Map<String, Object>> recentAttendance = attendanceService.getRecentAttendanceByStudent(studentId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", recentAttendance);
        return result;
    }
    
    /**
     * 获取学生当前进行中的签到
     * @param studentId 学生ID
     * @return 当前签到信息
     */
    @GetMapping("/student/current")
    public Map<String, Object> getCurrentAttendanceByStudent(@RequestParam Long studentId) {
        Map<String, Object> currentAttendance = attendanceService.getCurrentAttendanceByStudent(studentId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", currentAttendance);
        return result;
    }
    
    /**
     * 获取学生签到统计数据
     * @param studentId 学生ID
     * @return 统计数据
     */
    @GetMapping({"/student/stats", "/student/statistics"})
    public Map<String, Object> getAttendanceStatsByStudent(@RequestParam Long studentId) {
        Map<String, Object> stats = attendanceService.getAttendanceStatsByStudent(studentId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", stats);
        return result;
    }
    
    /**
     * 获取学生签到记录
     * @param studentId 学生ID
     * @param year 年份
     * @param month 月份
     * @return 签到记录列表
     */
    @GetMapping("/student/records")
    public Map<String, Object> getAttendanceRecordsByStudent(@RequestParam Long studentId, @RequestParam(required = false) Integer year, @RequestParam(required = false) Integer month) {
        List<Map<String, Object>> records = attendanceService.getAttendanceRecordsByStudent(studentId, year, month);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", records);
        return result;
    }

    /**
     * 结束签到
     * @param sessionCode 会话码
     * @return 结束结果
     */
    @GetMapping("/end")
    public Map<String, Object> endAttendance(@RequestParam String sessionCode) {
        return attendanceService.endAttendance(sessionCode);
    }

    @GetMapping("/courses")
    public Map<String, Object> getTeacherCourses(@RequestParam Long teacherId) {
        List<String> courses = attendanceService.getTeacherCourses(teacherId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "获取课程列表成功");
        result.put("data", courses);
        return result;
    }

    @GetMapping("/classes")
    public Map<String, Object> getTeacherClasses(@RequestParam Long teacherId) {
        List<String> classes = attendanceService.getTeacherClasses(teacherId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "获取班级列表成功");
        result.put("data", classes);
        return result;
    }

    /**
     * 获取签到会话状态
     * @param sessionCode 会话码
     * @return 签到状态信息
     */
    @GetMapping("/status")
    public Map<String, Object> getAttendanceStatus(@RequestParam String sessionCode) {
        return attendanceService.getAttendanceStatus(sessionCode);
    }

    /**
     * 刷新二维码
     * @param sessionCode 会话码
     * @return 新的二维码
     */
    @GetMapping("/refresh-qrcode")
    public Map<String, Object> refreshQRCode(@RequestParam String sessionCode) {
        return attendanceService.refreshQRCode(sessionCode);
    }

    /**
     * 获取签到会话信息
     * @param sessionCode 会话码
     * @return 签到会话信息
     */
    @GetMapping("/session/{sessionCode}")
    public Map<String, Object> getSessionInfo(@PathVariable String sessionCode) {
        return attendanceService.getSessionInfo(sessionCode);
    }
    
    /**
     * 获取签到会话的学生详情
     * @param sessionId 会话ID
     * @return 包含正常签到和未签到学生列表的Map
     */
    @GetMapping("/session/{sessionId}/students")
    public Map<String, Object> getSessionStudentDetails(@PathVariable Long sessionId) {
        return attendanceService.getSessionStudentDetails(sessionId);
    }
    
    /**
     * 更新学生签到状态
     * @param sessionId 会话ID
     * @param studentId 学生ID
     * @param status 状态（2:迟到, 3:请假）
     * @return 更新结果
     */
    @PostMapping("/session/{sessionId}/student/{studentId}/status")
    public Map<String, Object> updateStudentAttendanceStatus(
            @PathVariable Long sessionId,
            @PathVariable Long studentId,
            @RequestParam Integer status) {
        return attendanceService.updateStudentAttendanceStatus(sessionId, studentId, status);
    }
}