package campusattendance.attendance_student.controller;

import campusattendance.attendance_student.dto.ChangePasswordDTO;
import campusattendance.attendance_student.dto.Result;
import campusattendance.attendance_student.model.Student;
import campusattendance.attendance_student.model.Teacher;
import campusattendance.attendance_student.model.Clazz;
import campusattendance.attendance_student.service.ClassService;
import campusattendance.attendance_student.service.StudentService;
import campusattendance.attendance_student.service.TeacherService;
import campusattendance.attendance_student.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * 用户信息控制器
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private StudentService studentService;

    @Autowired
    private TeacherService teacherService;

    @Autowired
    private ClassService classService;

    /**
     * 获取当前登录用户的详细信息
     * @param authorization 请求头中的Authorization字段，包含JWT令牌
     * @return 用户详细信息
     */
    @GetMapping("/current")
    public Result<Map<String, Object>> getCurrentUserInfo(@RequestHeader("Authorization") String authorization) {
        logger.info("收到获取当前用户信息的请求，Authorization: {}", authorization);
        try {
            // 从请求头中提取令牌（去掉"Bearer "前缀）
            String token = authorization.substring(7);
            logger.info("提取的令牌: {}", token);

            // 从令牌中获取用户信息
            Long userId = jwtUtil.getUserIdFromToken(token);
            String role = jwtUtil.getRoleFromToken(token);
            logger.info("从令牌中获取的用户信息 - userId: {}, role: {}", userId, role);

            Map<String, Object> userInfo = new HashMap<>();

            if ("student".equals(role)) {
                // 获取学生详细信息
                logger.info("用户角色为学生，获取学生信息，studentId: {}", userId);
                Student student = studentService.findById(userId);
                if (student == null) {
                    logger.error("未找到学生信息，studentId: {}", userId);
                    return Result.fail("学生信息不存在");
                }
                // 设置学生信息
                userInfo.put("name", student.getName());
                userInfo.put("studentNo", student.getStudentNo());
                userInfo.put("phone", student.getPhone());
                
                // 通过班级获取学院信息和班级名称
                Clazz clazz = classService.getClassById(student.getClassId());
                if (clazz != null) {
                    userInfo.put("college", clazz.getDepartment());
                    userInfo.put("className", clazz.getClassName());
                } else {
                    userInfo.put("college", "");
                    userInfo.put("className", "");
                    logger.warn("未找到学生所属班级信息，studentId: {}", userId);
                }
                
                userInfo.put("role", "student");
            } else if ("teacher".equals(role)) {
                // 获取教师详细信息
                logger.info("用户角色为教师，获取教师信息，teacherId: {}", userId);
                Teacher teacher = teacherService.findById(userId);
                if (teacher == null) {
                    logger.error("未找到教师信息，teacherId: {}", userId);
                    return Result.fail("教师信息不存在");
                }
                // 设置教师信息
                userInfo.put("name", teacher.getName());
                userInfo.put("teacherNo", teacher.getTeacherNo());
                userInfo.put("phone", teacher.getPhone());
                
                // 通过教师教授的课程获取班级列表，再从班级中获取学院信息
                List<Map<String, Object>> classDetails = classService.getClassDetailsByTeacherId(userId);
                if (classDetails != null && !classDetails.isEmpty()) {
                    // 获取所有不重复的学院信息
                    Set<String> departments = new HashSet<>();
                    for (Map<String, Object> classDetail : classDetails) {
                        Object departmentObj = classDetail.get("department");
                        if (departmentObj != null && !departmentObj.toString().isEmpty()) {
                            departments.add(departmentObj.toString());
                        }
                    }
                    // 如果有学院信息，用逗号分隔；否则设为空
                    userInfo.put("college", String.join(",", departments));
                } else {
                    userInfo.put("college", "");
                }
                
                userInfo.put("role", "teacher");
            } else {
                logger.error("无效的用户角色: {}", role);
                return Result.fail("无效的用户角色");
            }
            
            logger.info("获取用户信息成功");
            return Result.success(userInfo);
        } catch (Exception e) {
            logger.error("获取用户信息失败", e);
            return Result.fail("获取用户信息失败");
        }
    }
    
    /**
     * 修改密码
     * @param authorization 请求头中的Authorization字段，包含JWT令牌
     * @param changePasswordDTO 修改密码请求参数
     * @return 修改结果
     */
    @PostMapping("/change-password")
    public Result<Void> changePassword(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody ChangePasswordDTO changePasswordDTO) {
        logger.info("收到修改密码请求");
        try {
            // 从请求头中提取令牌（去掉"Bearer "前缀）
            String token = authorization.substring(7);
            logger.info("提取的令牌: {}", token);

            // 从令牌中获取用户信息
            Long userId = jwtUtil.getUserIdFromToken(token);
            String role = jwtUtil.getRoleFromToken(token);
            logger.info("从令牌中获取的用户信息 - userId: {}, role: {}", userId, role);
            
            // 验证新密码和确认密码是否一致
            if (!changePasswordDTO.getNewPassword().equals(changePasswordDTO.getConfirmPassword())) {
                logger.error("新密码和确认密码不一致");
                return Result.fail("新密码和确认密码不一致");
            }
            
            boolean success = false;
            
            if ("student".equals(role)) {
                // 学生修改密码
                logger.info("用户角色为学生，修改密码，studentId: {}", userId);
                Student student = studentService.findById(userId);
                if (student == null) {
                    logger.error("未找到学生信息，studentId: {}", userId);
                    return Result.fail("学生信息不存在");
                }
                
                // 验证旧密码
                if (!changePasswordDTO.getOldPassword().equals(student.getPassword())) {
                    logger.error("旧密码错误");
                    return Result.fail("旧密码错误");
                }
                
                // 更新密码
                success = studentService.updatePassword(userId, changePasswordDTO.getNewPassword());
            } else if ("teacher".equals(role)) {
                // 教师修改密码
                logger.info("用户角色为教师，修改密码，teacherId: {}", userId);
                Teacher teacher = teacherService.findById(userId);
                if (teacher == null) {
                    logger.error("未找到教师信息，teacherId: {}", userId);
                    return Result.fail("教师信息不存在");
                }
                
                // 验证旧密码
                if (!changePasswordDTO.getOldPassword().equals(teacher.getPassword())) {
                    logger.error("旧密码错误");
                    return Result.fail("旧密码错误");
                }
                
                // 更新密码
                success = teacherService.updatePassword(userId, changePasswordDTO.getNewPassword());
            } else {
                logger.error("无效的用户角色: {}", role);
                return Result.fail("无效的用户角色");
            }
            
            if (success) {
                logger.info("密码修改成功");
                return Result.success();
            } else {
                logger.error("密码修改失败");
                return Result.fail("密码修改失败");
            }
            
        } catch (Exception e) {
            logger.error("修改密码失败: {}", e.getMessage(), e);
            return Result.fail(500, "修改密码失败：" + e.getMessage());
        }
    }
}