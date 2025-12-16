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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;

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

    @Value("${avatar.upload.path}")
    private String avatarUploadPath;

    @Value("${avatar.access.path}")
    private String avatarAccessPath;

    /**
     * 获取用户信息
     * @param authorization 请求头中的Authorization字段，包含JWT令牌
     * @return 用户信息
     */
    @GetMapping("/info")
    public Result<Map<String, Object>> getUserInfo(@RequestHeader("Authorization") String authorization, HttpServletRequest request) {
        logger.info("收到获取用户信息请求");
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
                logger.info("用户角色为学生，查询学生信息，studentId: {}", userId);
                Student student = studentService.findById(userId);
                if (student == null) {
                    logger.error("未找到学生信息，studentId: {}", userId);
                    return Result.fail("学生信息不存在");
                }

                userInfo.put("id", student.getId());
                userInfo.put("name", student.getName());
                userInfo.put("studentNo", student.getStudentNo());
                userInfo.put("phone", student.getPhone());
                userInfo.put("classId", student.getClassId());
                userInfo.put("role", "student");
                
                // 获取班级信息
                Clazz clazz = classService.getClassById(student.getClassId());
                if (clazz != null) {
                    userInfo.put("className", clazz.getClassName());
                    userInfo.put("college", clazz.getDepartment());
                } else {
                    userInfo.put("className", "未设置班级");
                    userInfo.put("college", "未设置学院");
                }
                
                // 构建完整的头像URL
                String avatar = student.getAvatar();
                if (avatar != null && !avatar.startsWith("http")) {
                    StringBuffer requestURL = request.getRequestURL();
                    String url = requestURL.substring(0, requestURL.length() - request.getRequestURI().length()) + request.getContextPath() + avatar;
                    userInfo.put("avatar", url);
                } else {
                    userInfo.put("avatar", avatar);
                }
            } else if ("teacher".equals(role)) {
                logger.info("用户角色为教师，查询教师信息，teacherId: {}", userId);
                Teacher teacher = teacherService.findById(userId);
                if (teacher == null) {
                    logger.error("未找到教师信息，teacherId: {}", userId);
                    return Result.fail("教师信息不存在");
                }

                userInfo.put("id", teacher.getId());
                userInfo.put("name", teacher.getName());
                userInfo.put("teacherNo", teacher.getTeacherNo());
                userInfo.put("phone", teacher.getPhone());
                userInfo.put("role", "teacher");
                
                // 获取教师所在学院信息（从教授的班级中获取）
                List<Map<String, Object>> classDetails = classService.getClassDetailsByTeacherId(userId);
                if (classDetails != null && !classDetails.isEmpty()) {
                    // 获取第一个班级的学院信息
                    String college = (String) classDetails.get(0).get("department");
                    userInfo.put("college", college);
                } else {
                    userInfo.put("college", "未设置学院");
                }
                
                // 构建完整的头像URL
                String avatar = teacher.getAvatar();
                if (avatar != null && !avatar.startsWith("http")) {
                    StringBuffer requestURL = request.getRequestURL();
                    String url = requestURL.substring(0, requestURL.length() - request.getRequestURI().length()) + request.getContextPath() + avatar;
                    userInfo.put("avatar", url);
                } else {
                    userInfo.put("avatar", avatar);
                }
            } else {
                logger.error("无效的用户角色: {}", role);
                return Result.fail("无效的用户角色");
            }

            logger.info("获取用户信息成功");
            return Result.success(userInfo);
        } catch (Exception e) {
            logger.error("获取用户信息失败: {}", e.getMessage(), e);
            return Result.fail(500, "获取用户信息失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取当前用户信息 (兼容旧接口)
     * @param authorization 请求头中的Authorization字段，包含JWT令牌
     * @return 用户信息
     */
    @GetMapping("/current")
    public Result<Map<String, Object>> getCurrentUserInfo(@RequestHeader("Authorization") String authorization, HttpServletRequest request) {
        return getUserInfo(authorization, request);
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
    
    /**
     * 上传头像
     * @param authorization 请求头中的Authorization字段，包含JWT令牌
     * @param file 头像文件
     * @return 上传结果
     */
    @PostMapping("/avatar")
    public Result<String> uploadAvatar(
            @RequestHeader("Authorization") String authorization,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        logger.info("收到上传头像请求");
        try {
            // 从请求头中提取令牌（去掉"Bearer "前缀）
            String token = authorization.substring(7);
            logger.info("提取的令牌: {}", token);

            // 从令牌中获取用户信息
            Long userId = jwtUtil.getUserIdFromToken(token);
            String role = jwtUtil.getRoleFromToken(token);
            logger.info("从令牌中获取的用户信息 - userId: {}, role: {}", userId, role);
            
            // 验证文件格式
            String contentType = file.getContentType();
            logger.info("文件类型: {}", contentType);
            if (contentType == null || ! ("image/jpeg".equals(contentType) || "image/png".equals(contentType))) {
                logger.error("文件格式错误，仅支持JPG和PNG图片");
                return Result.fail("文件格式错误，仅支持JPG和PNG图片");
            }
            
            // 验证文件大小
            logger.info("文件大小: {} MB", file.getSize() / (1024.0 * 1024.0));
            if (file.getSize() <= 0) { // 不能上传空文件
                logger.error("文件大小错误，不能上传空文件");
                return Result.fail("文件大小错误，不能上传空文件");
            }
            if (file.getSize() > 2 * 1024 * 1024) { // 2MB
                logger.error("文件大小超过限制，最大支持2MB");
                return Result.fail("文件大小超过限制，最大支持2MB");
            }
            
            // 验证图片分辨率
            BufferedImage image = ImageIO.read(file.getInputStream());
            int width = image.getWidth();
            int height = image.getHeight();
            logger.info("原始图片分辨率: {}x{}", width, height);
            if (width > 800 || height > 800) {
                logger.error("图片分辨率超过限制，最大支持800x800");
                return Result.fail("图片分辨率超过限制，最大支持800x800");
            }
            
            // 计算缩放比例，将图片缩放到120x120至240x240像素范围内
            int targetWidth, targetHeight;
            if (width <= 240 && height <= 240) {
                // 如果图片已经在目标尺寸范围内，保持原始尺寸
                targetWidth = width;
                targetHeight = height;
            } else {
                // 计算缩放比例，保持宽高比
                double aspectRatio = (double) width / height;
                if (aspectRatio >= 1) {
                    // 宽图
                    targetWidth = 240;
                    targetHeight = (int) (240 / aspectRatio);
                } else {
                    // 高图
                    targetHeight = 240;
                    targetWidth = (int) (240 * aspectRatio);
                }
                
                // 确保不小于最小尺寸
                targetWidth = Math.max(targetWidth, 120);
                targetHeight = Math.max(targetHeight, 120);
            }
            
            logger.info("缩放后图片尺寸: {}x{}", targetWidth, targetHeight);
            
            // 创建缩放后的图片
            BufferedImage resizedImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = resizedImage.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(image, 0, 0, targetWidth, targetHeight, null);
            g.dispose();
            
            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
            String fileName = UUID.randomUUID().toString() + suffix;
            
            // 按日期创建存储目录
            String dateDir = new SimpleDateFormat("yyyy/MM/dd").format(new Date());
            File dir = new File(avatarUploadPath + dateDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            // 保存缩放后的文件
            File dest = new File(dir, fileName);
            logger.info("保存文件路径: {}", dest.getAbsolutePath());
            
            // 根据文件类型保存图片
            String formatName = suffix.substring(1); // 去掉点号
            ImageIO.write(resizedImage, formatName, dest);
            
            // 保存头像路径到数据库
            String avatarPath = avatarAccessPath + dateDir + "/" + fileName;
            
            // 构建完整的头像URL
            StringBuffer requestURL = request.getRequestURL();
            String url = requestURL.substring(0, requestURL.length() - request.getRequestURI().length()) + request.getContextPath() + avatarPath;
            
            boolean success = false;
            
            if ("student".equals(role)) {
                logger.info("用户角色为学生，保存头像路径，studentId: {}", userId);
                success = studentService.updateAvatar(userId, avatarPath);
            } else if ("teacher".equals(role)) {
                logger.info("用户角色为教师，保存头像路径，teacherId: {}", userId);
                success = teacherService.updateAvatar(userId, avatarPath);
            }
            
            if (success) {
                logger.info("头像上传成功，保存路径: {}", avatarPath);
                logger.info("头像访问URL: {}", url);
                return Result.success(url);
            } else {
                logger.error("头像路径保存失败");
                return Result.fail("头像上传失败");
            }
            
        } catch (IOException e) {
            logger.error("头像上传失败: {}", e.getMessage(), e);
            return Result.fail(500, "头像上传失败：" + e.getMessage());
        } catch (Exception e) {
            logger.error("头像上传失败: {}", e.getMessage(), e);
            return Result.fail(500, "头像上传失败：" + e.getMessage());
        }
    }
}