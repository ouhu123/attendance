package campusattendance.attendance_student.controller;

import campusattendance.attendance_student.dto.Result;
import campusattendance.attendance_student.model.Clazz;
import campusattendance.attendance_student.model.Student;
import campusattendance.attendance_student.model.Teacher;
import campusattendance.attendance_student.service.ClassService;
import campusattendance.attendance_student.service.StudentService;
import campusattendance.attendance_student.service.TeacherService;
import campusattendance.attendance_student.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
                logger.info("获取到学生信息: {}", student);

                // 根据学生的班级ID获取班级信息，从而获取学院（department）
                String college = "";
                if (student.getClassId() != null) {
                    logger.info("根据班级ID获取班级信息，classId: {}", student.getClassId());
                    Clazz clazz = classService.getClassById(student.getClassId());
                    if (clazz != null) {
                        college = clazz.getDepartment();
                        logger.info("获取到班级信息: {}, 学院: {}", clazz, college);
                    } else {
                        logger.info("未找到班级信息，classId: {}", student.getClassId());
                    }
                } else {
                    logger.info("学生未分配班级，classId: null");
                }

                // 构建响应数据
                userInfo.put("id", student.getId());
                userInfo.put("studentNo", student.getStudentNo());
                userInfo.put("name", student.getName());
                userInfo.put("phone", student.getPhone());
                userInfo.put("college", college);
                userInfo.put("avatar", student.getAvatar());
                userInfo.put("role", "student");
                logger.info("构建的学生响应数据: {}", userInfo);
            } else if ("teacher".equals(role)) {
                // 获取教师详细信息
                logger.info("用户角色为教师，获取教师信息，teacherId: {}", userId);
                Teacher teacher = teacherService.findById(userId);
                if (teacher == null) {
                    logger.error("未找到教师信息，teacherId: {}", userId);
                    return Result.fail("教师信息不存在");
                }
                logger.info("获取到教师信息: {}", teacher);

                // 获取教师的学院信息（通过教授的课程关联到班级）
                String college = "未分配学院";
                // 获取教师教授的班级详情
                logger.info("获取教师教授的班级详情，teacherId: {}", userId);
                List<Map<String, Object>> classDetails = classService.getClassDetailsByTeacherId(userId);
                logger.info("获取到的班级详情数量: {}", classDetails != null ? classDetails.size() : 0);
                if (classDetails != null && !classDetails.isEmpty()) {
                    // 从第一个班级中获取学院信息
                    Map<String, Object> firstClass = classDetails.get(0);
                    logger.info("第一个班级详情: {}", firstClass);
                    if (firstClass != null && firstClass.containsKey("department")) {
                        Object deptObj = firstClass.get("department");
                        if (deptObj != null) {
                            college = deptObj.toString();
                            logger.info("从班级详情中获取到学院信息: {}", college);
                        } else {
                            logger.info("班级详情中department字段为null");
                        }
                    } else {
                        logger.info("班级详情中不包含department字段");
                    }
                } else {
                    logger.info("教师未教授任何班级或未找到班级详情，使用默认学院信息");
                }

                // 构建响应数据
                userInfo.put("id", teacher.getId());
                userInfo.put("teacherNo", teacher.getTeacherNo());
                userInfo.put("name", teacher.getName());
                userInfo.put("phone", teacher.getPhone());
                userInfo.put("college", college);
                userInfo.put("avatar", teacher.getAvatar());
                userInfo.put("role", "teacher");
                logger.info("构建的教师响应数据: {}", userInfo);
            } else {
                logger.error("无效的用户角色: {}", role);
                return Result.fail("无效的用户角色");
            }

            logger.info("成功获取用户信息，返回结果: {}", userInfo);
            return Result.success(userInfo);
        } catch (Exception e) {
            logger.error("获取用户信息失败: {}", e.getMessage(), e);
            return Result.fail(500, "获取用户信息失败：" + e.getMessage());
        }
    }
}