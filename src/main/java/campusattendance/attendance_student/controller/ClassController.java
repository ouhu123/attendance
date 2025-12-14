package campusattendance.attendance_student.controller;

import campusattendance.attendance_student.model.Clazz;
import campusattendance.attendance_student.service.ClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 班级管理控制器
 */
@RestController
@RequestMapping("/api/class")
public class ClassController {
    
    @Autowired
    private ClassService classService;
    
    /**
     * 获取所有班级
     * @return 班级列表
     */
    @GetMapping("/all")
    public Map<String, Object> getAllClasses() {
        List<Clazz> classes = classService.getAllClasses();
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", classes);
        return result;
    }
    
    /**
     * 根据ID获取班级
     * @param id 班级ID
     * @return 班级信息
     */
    @GetMapping("/detail")
    public Map<String, Object> getClassById(@RequestParam Long id) {
        Clazz clazz = classService.getClassById(id);
        Map<String, Object> result = new java.util.HashMap<>();
        if (clazz != null) {
            result.put("code", 200);
            result.put("message", "success");
            result.put("data", clazz);
        } else {
            result.put("code", 404);
            result.put("message", "班级不存在");
        }
        return result;
    }
    
    /**
     * 添加班级
     * @param clazz 班级信息
     * @return 添加结果
     */
    @PostMapping("/add")
    public Map<String, Object> addClass(@RequestBody Clazz clazz) {
        return classService.addClass(clazz);
    }
    
    /**
     * 更新班级
     * @param clazz 班级信息
     * @return 更新结果
     */
    @PostMapping("/update")
    public Map<String, Object> updateClass(@RequestBody Clazz clazz) {
        return classService.updateClass(clazz);
    }
    
    /**
     * 删除班级
     * @param id 班级ID
     * @return 删除结果
     */
    @GetMapping("/delete")
    public Map<String, Object> deleteClass(@RequestParam Long id) {
        return classService.deleteClass(id);
    }
    
    /**
     * 获取班级详情（包含学生数量和课程数量）
     * @return 班级详情列表
     */
    @GetMapping("/details")
    public Map<String, Object> getClassDetails() {
        List<Map<String, Object>> classDetails = classService.getClassDetails();
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", classDetails);
        return result;
    }
    
    /**
     * 根据教师ID获取班级详情（包含学生数量和课程数量）
     * @param teacherId 教师ID
     * @return 班级详情列表
     */
    @GetMapping("/teacher/details")
    public Map<String, Object> getClassDetailsByTeacherId(@RequestParam Long teacherId) {
        List<Map<String, Object>> classDetails = classService.getClassDetailsByTeacherId(teacherId);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", classDetails);
        return result;
    }
    
    /**
     * 根据班级ID获取班级学生列表及签到统计
     * @param classId 班级ID
     * @return 学生列表及签到统计
     */
    @GetMapping("/students")
    public Map<String, Object> getStudentsWithAttendanceStats(@RequestParam Long classId) {
        List<Map<String, Object>> students = classService.getStudentsWithAttendanceStats(classId);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", students);
        return result;
    }
}