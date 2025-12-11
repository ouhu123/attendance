package campusattendance.attendance_student.controller;

import campusattendance.attendance_student.dto.LoginRequest;
import campusattendance.attendance_student.dto.LoginResponse;
import campusattendance.attendance_student.dto.Result;
import campusattendance.attendance_student.model.Student;
import campusattendance.attendance_student.model.Teacher;
import campusattendance.attendance_student.service.StudentService;
import campusattendance.attendance_student.service.TeacherService;
import campusattendance.attendance_student.util.JwtUtil;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 登录控制器
 */
@RestController
@RequestMapping("/api/auth")
@Validated
public class LoginController {
    
    private static final Logger logger = LoggerFactory.getLogger(LoginController.class);
    
    @Autowired
    private StudentService studentService;
    
    @Autowired
    private TeacherService teacherService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    /**
     * 用户登录
     * @param loginRequest 登录请求参数
     * @return 登录响应
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        logger.info("Login request received: username={}, type={}", loginRequest.getUsername(), loginRequest.getType());
        
        String username = loginRequest.getUsername();
        String password = loginRequest.getPassword();
        String type = loginRequest.getType();
        
        LoginResponse response;
        
        try {
            if ("student".equals(type)) {
                // 学生登录
                logger.info("Student login: finding student by no={}", username);
                Student student = studentService.findByStudentNo(username);
                if (student == null) {
                    logger.info("Student not found: {}", username);
                    return Result.fail("学号不存在");
                }
                
                logger.info("Student found: id={}, name={}, password={}", student.getId(), student.getName(), student.getPassword());
                
                // 验证密码（明文比较）
                if (!password.equals(student.getPassword())) {
                    logger.info("Student password mismatch: expected={}, got={}", student.getPassword(), password);
                    return Result.fail("密码错误");
                }
                
                logger.info("Student password matched: {}", username);
                
                // 生成JWT令牌
                String token = jwtUtil.generateToken(student.getId(), student.getStudentNo(), "student");
                
                // 构造响应
                response = new LoginResponse(token, "Bearer", student.getId(), student.getStudentNo(), 
                        student.getName(), "student", student.getAvatar());
            } else if ("teacher".equals(type)) {
                // 教师登录
                logger.info("Teacher login: finding teacher by no={}", username);
                Teacher teacher = teacherService.findByTeacherNo(username);
                if (teacher == null) {
                    logger.info("Teacher not found: {}", username);
                    return Result.fail("工号不存在");
                }
                
                logger.info("Teacher found: id={}, name={}, password={}", teacher.getId(), teacher.getName(), teacher.getPassword());
                
                // 验证密码（明文比较）
                if (!password.equals(teacher.getPassword())) {
                    logger.info("Teacher password mismatch: expected={}, got={}", teacher.getPassword(), password);
                    return Result.fail("密码错误");
                }
                
                logger.info("Teacher password matched: {}", username);
                
                // 生成JWT令牌
                String token = jwtUtil.generateToken(teacher.getId(), teacher.getTeacherNo(), "teacher");
                
                // 构造响应
                response = new LoginResponse(token, "Bearer", teacher.getId(), teacher.getTeacherNo(), 
                        teacher.getName(), "teacher", teacher.getAvatar());
            } else {
                logger.info("Invalid user type: {}", type);
                return Result.fail("用户类型错误");
            }
            
            logger.info("Login successful for: username={}, type={}", username, type);
            return Result.success(response);
        } catch (Exception e) {
            logger.error("Login error for: username={}, type={}", username, type, e);
            return Result.fail(500, "登录失败，请联系管理员");
        }
    }
}