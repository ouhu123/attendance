package campusattendance.attendance_student.controller;

import campusattendance.attendance_student.dto.AttendanceSignDTO;
import campusattendance.attendance_student.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import campusattendance.attendance_student.service.StudentService;

/**
 * 学生签到控制器
 */
@RestController
@RequestMapping("/api/attendance/student")
public class StudentController {

    @Autowired
    private AttendanceService attendanceService;
    
    @Autowired
    private StudentService studentService;

    /**
     * 获取学生当前进行中的签到
     * @param studentId 学生ID
     * @param studentNo 学生编号
     * @return 当前签到信息
     */
    @GetMapping("/current")
    public Map<String, Object> getCurrentAttendance(
            @RequestParam Long studentId,
            @RequestParam(required = false) String studentNo) {
        Map<String, Object> currentAttendance = attendanceService.getCurrentAttendanceByStudent(studentId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", currentAttendance);
        return result;
    }

    /**
     * 获取学生最近签到记录
     * @param studentId 学生ID
     * @param studentNo 学生编号
     * @return 最近签到记录列表
     */
    @GetMapping("/recent")
    public Map<String, Object> getRecentAttendance(
            @RequestParam Long studentId,
            @RequestParam(required = false) String studentNo) {
        List<Map<String, Object>> recentAttendance = attendanceService.getRecentAttendanceByStudent(studentId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", recentAttendance);
        return result;
    }

    /**
     * 获取学生签到统计数据
     * @param studentId 学生ID
     * @param studentNo 学生编号
     * @return 统计数据
     */
    @GetMapping("/statistics")
    public Map<String, Object> getAttendanceStatistics(
            @RequestParam Long studentId,
            @RequestParam(required = false) String studentNo) {
        Map<String, Object> statistics = attendanceService.getAttendanceStatsByStudent(studentId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", statistics);
        return result;
    }

    /**
     * 获取学生签到记录
     * @param studentId 学生ID
     * @param studentNo 学生编号
     * @param year 年份
     * @param month 月份
     * @return 签到记录列表
     */
    @GetMapping("/records")
    public Map<String, Object> getAttendanceRecords(
            @RequestParam Long studentId,
            @RequestParam(required = false) String studentNo,
            @RequestParam Integer year,
            @RequestParam Integer month) {
        List<Map<String, Object>> records = attendanceService.getAttendanceRecordsByStudent(studentId, year, month);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", records);
        return result;
    }
    
    /**
     * 学生扫码签到
     * @param attendanceSignDTO 签到请求数据
     * @return 签到结果
     */
    @PostMapping("/sign")
    public Map<String, Object> signAttendance(@RequestBody AttendanceSignDTO attendanceSignDTO) {
        // 从数据库获取学生姓名
        String studentName = "";
        campusattendance.attendance_student.model.Student student = null;
        
        // 优先使用studentId查询学生信息
        if (attendanceSignDTO.getStudentId() != null) {
            student = studentService.findById(attendanceSignDTO.getStudentId());
            if (student != null) {
                studentName = student.getName();
            }
        }
        
        // 如果通过studentId没有找到学生，使用studentNo查询
        if (student == null && attendanceSignDTO.getStudentNo() != null && !attendanceSignDTO.getStudentNo().isEmpty()) {
            student = studentService.findByStudentNo(attendanceSignDTO.getStudentNo());
            if (student != null) {
                studentName = student.getName();
            } else {
                // 学生不存在，返回错误
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("message", "学生信息不存在");
                return result;
            }
        } else if (student == null) {
            // 学生学号和ID都为空，返回错误
            Map<String, Object> result = new HashMap<>();
            result.put("code", 400);
            result.put("message", "学生信息不能为空");
            return result;
        }
        
        // 确保学生姓名不为空
        if (studentName == null || studentName.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 400);
            result.put("message", "学生姓名不能为空");
            return result;
        }
        
        // 调用AttendanceService的签到方法
        // 优先使用sessionCode，如果没有则使用token
        String tokenOrSessionCode = attendanceSignDTO.getSessionCode();
        if (tokenOrSessionCode == null || tokenOrSessionCode.isEmpty()) {
            tokenOrSessionCode = attendanceSignDTO.getToken();
        }
        
        return attendanceService.scanAttendance(
                tokenOrSessionCode,
                attendanceSignDTO.getStudentId(),
                attendanceSignDTO.getStudentNo(),
                studentName,
                attendanceSignDTO.getLongitude(),
                attendanceSignDTO.getLatitude(),
                attendanceSignDTO.getGesture()
        );
    }
}