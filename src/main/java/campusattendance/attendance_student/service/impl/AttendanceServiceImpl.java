package campusattendance.attendance_student.service.impl;

import campusattendance.attendance_student.mapper.AttendanceSessionMapper;
import campusattendance.attendance_student.mapper.AttendanceRecordMapper;
import campusattendance.attendance_student.mapper.CourseMapper;
import campusattendance.attendance_student.mapper.ClassMapper;
import campusattendance.attendance_student.mapper.CourseClassMapper;
import campusattendance.attendance_student.mapper.StudentMapper;
import campusattendance.attendance_student.model.AttendanceSession;
import campusattendance.attendance_student.model.AttendanceRecord;
import campusattendance.attendance_student.model.Course;
import campusattendance.attendance_student.model.Clazz;
import campusattendance.attendance_student.model.CourseClass;
import campusattendance.attendance_student.model.Student;
import campusattendance.attendance_student.service.AttendanceService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.Objects;
import java.util.ArrayList;

/**
 * 签到服务实现
 */
@Service
public class AttendanceServiceImpl implements AttendanceService {

    @Autowired
    private AttendanceSessionMapper attendanceSessionMapper;

    @Autowired
    private AttendanceRecordMapper attendanceRecordMapper;

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private ClassMapper classMapper;

    @Autowired
    private CourseClassMapper courseClassMapper;

    @Autowired
    private StudentMapper studentMapper;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final String SESSION_PREFIX = "attendance:session:";
    private static final String ATTENDANCE_PREFIX = "attendance:record:";
    private static final String TOKEN_PREFIX = "attendance:token:";
    private static final int TOKEN_TTL = 60; // Token有效期60秒

    /**
     * 计算两点之间的距离(米)
     * @param longitude1 经度1
     * @param latitude1 纬度1
     * @param longitude2 经度2
     * @param latitude2 纬度2
     * @return 距离(米)
     */
    private double calculateDistance(double longitude1, double latitude1, double longitude2, double latitude2) {
        final int R = 6371000; // 地球半径(米)
        double lat1 = Math.toRadians(latitude1);
        double lat2 = Math.toRadians(latitude2);
        double deltaLat = Math.toRadians(latitude2 - latitude1);
        double deltaLng = Math.toRadians(longitude2 - longitude1);

        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * 生成二维码
     * @param content 二维码内容
     * @return Base64编码的二维码图片
     */
    private String generateQRCode(String content) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, 300, 300);
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", byteArrayOutputStream);
            return Base64.getEncoder().encodeToString(byteArrayOutputStream.toByteArray());
        } catch (WriterException | IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public Map<String, Object> initiateAttendance(Long teacherId, String teacherNo, String courseName, String className, Double longitude, Double latitude, Integer duration, Integer attendanceType, Integer radius, String gesture) {
        // 生成唯一会话码
        String sessionCode = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        
        // 生成token（用于二维码验证）
        String token = UUID.randomUUID().toString().replace("-", "");

        // 创建签到会话
        AttendanceSession attendanceSession = new AttendanceSession();
        attendanceSession.setSessionCode(sessionCode);
        attendanceSession.setTeacherId(teacherId);
        attendanceSession.setTeacherNo(teacherNo);
        attendanceSession.setCourseName(courseName);
        attendanceSession.setClassName(className);
        attendanceSession.setLongitude(longitude);
        attendanceSession.setLatitude(latitude);
        attendanceSession.setRadius(radius); // 使用传入的半径，仅在地理位置签到时有效
        attendanceSession.setAttendanceType(attendanceType);
        attendanceSession.setDuration(duration);
        attendanceSession.setGesture(gesture); // 设置九宫格手势密码（仅在九宫格签到时有效）
        attendanceSession.setStartTime(LocalDateTime.now());
        attendanceSession.setEndTime(LocalDateTime.now().plusMinutes(duration)); // 根据指定时长设置结束时间
        attendanceSession.setStatus(1); // 1: 进行中
        attendanceSession.setCreateTime(LocalDateTime.now());
        attendanceSession.setUpdateTime(LocalDateTime.now());

        // 保存到数据库
        attendanceSessionMapper.insert(attendanceSession);

        // 保存会话信息到Redis，过期时间15分钟
        redisTemplate.opsForValue().set(SESSION_PREFIX + sessionCode, attendanceSession.toString(), 15, TimeUnit.MINUTES);
        
        // 保存token到Redis，过期时间60秒
        redisTemplate.opsForValue().set(TOKEN_PREFIX + token, sessionCode, TOKEN_TTL, TimeUnit.SECONDS);

        // 生成二维码，包含token
        String qrCode = generateQRCode(token);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionCode", sessionCode);
        result.put("courseName", courseName);
        result.put("className", className);
        result.put("startTime", attendanceSession.getStartTime().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        result.put("endTime", attendanceSession.getEndTime().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        result.put("qrCode", qrCode);

        return result;
    }

    @Override
    public Map<String, Object> scanAttendance(String tokenOrSessionCode, Long studentId, String studentNo, String studentName, Double longitude, Double latitude, String gesture) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 智能处理传入的参数 - 如果是token则从Redis获取sessionCode，否则直接作为sessionCode使用
            String sessionCode;
            
            // 检查是否为token（尝试从Redis获取sessionCode）
            String tokenKey = TOKEN_PREFIX + tokenOrSessionCode;
            if (redisTemplate.hasKey(tokenKey)) {
                // 传入的是token，从Redis获取sessionCode
                sessionCode = redisTemplate.opsForValue().get(tokenKey);
            } else {
                // 传入的是直接的sessionCode，直接使用
                sessionCode = tokenOrSessionCode;
            }
            
            // 检查会话是否存在
            String sessionKey = SESSION_PREFIX + sessionCode;
            AttendanceSession session = null;
            if (!redisTemplate.hasKey(sessionKey)) {
                // 从数据库查询
                session = attendanceSessionMapper.selectBySessionCode(sessionCode);
                if (session == null) {
                    result.put("code", 400);
                    result.put("message", "签到已结束或不存在");
                    return result;
                }
                // 检查时间是否过期，如果未过期但状态不是1，可能是状态更新延迟，允许继续
                LocalDateTime now = LocalDateTime.now();
                if (now.isAfter(session.getEndTime())) {
                    // 时间已过期，更新状态
                    if (session.getStatus() == 1) {
                        session.setStatus(2); // 2: 已结束
                        session.setEndTime(now);
                        session.setUpdateTime(LocalDateTime.now());
                        attendanceSessionMapper.updateById(session);
                        recordAbsentStudents(session);
                    }
                    result.put("code", 400);
                    result.put("message", "签到已结束");
                    return result;
                }
                // 如果状态不是1但时间未过期，可能是状态同步问题，更新状态为1
                if (session.getStatus() != 1) {
                    session.setStatus(1); // 恢复为进行中
                    session.setUpdateTime(LocalDateTime.now());
                    attendanceSessionMapper.updateById(session);
                }
                // 更新Redis
                redisTemplate.opsForValue().set(sessionKey, session.toString(), 15, TimeUnit.MINUTES);
            }

            // 检查是否已签到
            String attendanceKey = ATTENDANCE_PREFIX + sessionCode + ":" + studentId;
            if (redisTemplate.hasKey(attendanceKey)) {
                result.put("code", 400);
                result.put("message", "您已签到，请勿重复签到");
                return result;
            }

            // 从数据库获取会话信息（兜底，避免空指针）
            if (session == null) {
                session = attendanceSessionMapper.selectBySessionCode(sessionCode);
                if (session == null) {
                    result.put("code", 400);
                    result.put("message", "签到会话不存在，请重新获取二维码");
                    return result;
                }
            }

            // 检查签到时间是否过期
            if (LocalDateTime.now().isAfter(session.getEndTime())) {
                session.setStatus(2); // 2: 已结束
                attendanceSessionMapper.updateById(session);
                redisTemplate.delete(sessionKey);
                
                // 自动为未签到的学生创建缺勤记录
                recordAbsentStudents(session);

                result.put("code", 400);
                result.put("message", "签到已结束");
                return result;
            }

            // 地理位置签到（类型2）需要进行地理位置校验
            if (session.getAttendanceType() == 2) {
                // 检查经纬度是否有效
                if (longitude == null || latitude == null || longitude == 0.0 || latitude == 0.0) {
                    result.put("code", 400);
                    result.put("message", "请先获取有效的地理位置信息");
                    return result;
                }
                
                // 检查签到会话中的经纬度是否有效
                if (session.getLongitude() == null || session.getLatitude() == null) {
                    result.put("code", 400);
                    result.put("message", "签到会话的地理位置信息无效");
                    return result;
                }
                
                // 地理位置校验
                double distance = calculateDistance(longitude, latitude, session.getLongitude(), session.getLatitude());
                if (distance > session.getRadius()) {
                    result.put("code", 400);
                    result.put("message", "超出签到范围");
                    return result;
                }
            } 
            // 手势签到（类型3）需要进行手势校验
            else if (session.getAttendanceType() == 3) {
                // 检查手势是否有效
                if (gesture == null || gesture.isEmpty()) {
                    result.put("code", 400);
                    result.put("message", "请绘制手势");
                    return result;
                }
                
                // 检查签到会话中的手势是否有效
                if (session.getGesture() == null || session.getGesture().isEmpty()) {
                    result.put("code", 400);
                    result.put("message", "签到会话的手势信息无效");
                    return result;
                }
                
                // 手势校验
                if (!gesture.equals(session.getGesture())) {
                    result.put("code", 400);
                    result.put("message", "手势错误");
                    return result;
                }
            }

            // 创建签到记录
            AttendanceRecord attendanceRecord = new AttendanceRecord();
            attendanceRecord.setSessionId(session.getId());
            attendanceRecord.setSessionCode(sessionCode);
            attendanceRecord.setStudentId(studentId);
            attendanceRecord.setStudentNo(studentNo);
            attendanceRecord.setStudentName(studentName);
            attendanceRecord.setCourseName(session.getCourseName());
            attendanceRecord.setClassName(session.getClassName());
            // 非地理位置签到时，为经纬度设置默认值0.0，避免数据库约束错误
            attendanceRecord.setLongitude(session.getAttendanceType() == 2 ? longitude : 0.0);
            attendanceRecord.setLatitude(session.getAttendanceType() == 2 ? latitude : 0.0);
            attendanceRecord.setStatus(1); // 1: 正常签到
            attendanceRecord.setSignTime(LocalDateTime.now());
            attendanceRecord.setCreateTime(LocalDateTime.now());
            attendanceRecord.setUpdateTime(LocalDateTime.now());

            // 保存到数据库
            attendanceRecordMapper.insert(attendanceRecord);

            // 保存到Redis，标记已签到
            redisTemplate.opsForValue().set(attendanceKey, "1", 15, TimeUnit.MINUTES);

            result.put("code", 200);
            result.put("message", "签到成功");
            result.put("signTime", attendanceRecord.getSignTime());

            return result;
        } catch (Exception e) {
            // 捕获所有异常，避免500错误
            result.put("code", 500);
            result.put("message", "签到失败，请稍后重试");
            // 记录日志，方便调试
            e.printStackTrace();
            return result;
        }
    }

    @Override
    public boolean checkSessionValid(String sessionCode) {
        String sessionKey = SESSION_PREFIX + sessionCode;
        return redisTemplate.hasKey(sessionKey);
    }

    @Override
    public List<Map<String, Object>> getRecentAttendanceByTeacher(Long teacherId) {
        // 查询教师的签到会话列表
        List<AttendanceSession> sessions = attendanceSessionMapper.selectByTeacherId(teacherId);
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);

        for (AttendanceSession session : sessions) {
            // 只处理今天创建的签到会话
            if (session.getCreateTime().isBefore(today)) {
                continue;
            }
            
            // 检查签到是否应该自动结束
            if (session.getStatus() == 1 && now.isAfter(session.getEndTime())) {
                // 更新签到会话状态为已结束
                session.setStatus(2); // 2: 已结束
                session.setEndTime(now); // 更新结束时间为当前时间
                session.setUpdateTime(LocalDateTime.now());
                attendanceSessionMapper.updateById(session);
                
                // 删除Redis中的会话信息
                String sessionKey = SESSION_PREFIX + session.getSessionCode();
                redisTemplate.delete(sessionKey);
                
                // 自动为未签到的学生创建缺勤记录
                recordAbsentStudents(session);
            }
            
            Map<String, Object> attendanceInfo = new HashMap<>();
            attendanceInfo.put("id", session.getId());
            attendanceInfo.put("courseName", session.getCourseName());
            attendanceInfo.put("className", session.getClassName());
            attendanceInfo.put("date", session.getStartTime().toString());
            
            // 检查签到状态
            String status = "已结束";
            int remainingSeconds = 0;
            
            if (session.getStatus() == 1 && now.isBefore(session.getEndTime())) {
                status = "进行中";
                // 计算剩余时间（秒）
                remainingSeconds = (int) java.time.Duration.between(now, session.getEndTime()).getSeconds();
                // 确保剩余时间不会为负数
                remainingSeconds = Math.max(remainingSeconds, 0);
            }
            
            attendanceInfo.put("status", status);
            attendanceInfo.put("remainingSeconds", remainingSeconds);

            // 统计该签到会话的出勤人数
            int attendanceCount = attendanceRecordMapper.countBySessionId(session.getId());
            attendanceInfo.put("attendanceCount", attendanceCount);
            
            // 查询该班级的实际学生总数
            Long classId = classMapper.selectIdByClassName(session.getClassName());
            int totalStudents = 0;
            String department = "";
            String grade = "";
            if (classId != null) {
                totalStudents = studentMapper.countByClassId(classId);
                // 获取班级的department和grade信息
                Clazz clazz = classMapper.selectById(classId);
                if (clazz != null) {
                    department = clazz.getDepartment();
                    grade = clazz.getGrade();
                }
            }
            attendanceInfo.put("totalStudents", totalStudents);
            attendanceInfo.put("department", department);
            attendanceInfo.put("grade", grade);

            result.add(attendanceInfo);
        }

        return result;
    }

    @Override
    public List<Map<String, Object>> getAllAttendanceByTeacher(Long teacherId) {
        // 查询教师的所有签到会话列表
        List<AttendanceSession> sessions = attendanceSessionMapper.selectByTeacherId(teacherId);
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (AttendanceSession session : sessions) {
            // 检查签到是否应该自动结束
            if (session.getStatus() == 1 && now.isAfter(session.getEndTime())) {
                // 更新签到会话状态为已结束
                session.setStatus(2); // 2: 已结束
                session.setEndTime(now); // 更新结束时间为当前时间
                session.setUpdateTime(LocalDateTime.now());
                attendanceSessionMapper.updateById(session);
                
                // 删除Redis中的会话信息
                String sessionKey = SESSION_PREFIX + session.getSessionCode();
                redisTemplate.delete(sessionKey);
                
                // 自动为未签到的学生创建缺勤记录
                recordAbsentStudents(session);
            }
            
            Map<String, Object> attendanceInfo = new HashMap<>();
            attendanceInfo.put("id", session.getId());
            attendanceInfo.put("courseName", session.getCourseName());
            attendanceInfo.put("className", session.getClassName());
            attendanceInfo.put("date", session.getStartTime().toString());
            
            // 检查签到状态
            String status = "已结束";
            int remainingSeconds = 0;
            
            if (session.getStatus() == 1 && now.isBefore(session.getEndTime())) {
                status = "进行中";
                // 计算剩余时间（秒）
                remainingSeconds = (int) java.time.Duration.between(now, session.getEndTime()).getSeconds();
                // 确保剩余时间不会为负数
                remainingSeconds = Math.max(remainingSeconds, 0);
            }
            
            attendanceInfo.put("status", status);
            attendanceInfo.put("remainingSeconds", remainingSeconds);

            // 统计该签到会话的出勤人数
            int attendanceCount = attendanceRecordMapper.countBySessionId(session.getId());
            attendanceInfo.put("attendanceCount", attendanceCount);
            
            // 查询该班级的实际学生总数
            Long classId = classMapper.selectIdByClassName(session.getClassName());
            int totalStudents = 0;
            String department = "";
            String grade = "";
            if (classId != null) {
                totalStudents = studentMapper.countByClassId(classId);
                Clazz clazz = classMapper.selectById(classId);
                if (clazz != null) {
                    department = clazz.getDepartment();
                    grade = clazz.getGrade();
                }
            }
            attendanceInfo.put("totalStudents", totalStudents);
            attendanceInfo.put("department", department);
            attendanceInfo.put("grade", grade);

            // 计算出勤率
            double attendanceRate = 0;
            if (attendanceInfo.get("totalStudents") != null && (int) attendanceInfo.get("totalStudents") > 0) {
                attendanceRate = (double) attendanceCount / (int) attendanceInfo.get("totalStudents") * 100;
            }
            attendanceInfo.put("attendanceRate", String.format("%.1f%%", attendanceRate));
            attendanceInfo.put("attendanceStatus", status);

            result.add(attendanceInfo);
        }

        return result;
    }

    @Override
    public Map<String, Object> getAttendanceStatsByTeacher(Long teacherId) {
        Map<String, Object> stats = new HashMap<>();

        // 1. 获取教师对应的课程数量（从数据库course表查询）
        List<Course> courses = courseMapper.selectByTeacherId(teacherId);
        int totalCourses = courses.size();

        // 2. 统计今日签到次数
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        List<AttendanceSession> sessions = attendanceSessionMapper.selectByTeacherId(teacherId);
        int todayAttendance = (int) sessions.stream()
                .filter(session -> session.getCreateTime().isAfter(today))
                .count();

        // 3. 计算今日平均出勤率：(今日正常签到+迟到+请假)/对应班级总人数
        double totalAttendanceRate = 0;
        int validSessions = 0;
        
        for (AttendanceSession session : sessions) {
            // 只处理今日的签到会话
            if (session.getCreateTime().isBefore(today)) {
                continue;
            }
            
            // 统计该会话的正常签到(1)、迟到(2)、请假(3)的学生总数
            List<AttendanceRecord> records = attendanceRecordMapper.selectBySessionId(session.getId());
            long attendedStudents = records.stream()
                    .filter(record -> record.getStatus() == 1 || record.getStatus() == 2 || record.getStatus() == 3)
                    .count();
            
            // 获取对应班级的总人数
            Long classId = classMapper.selectIdByClassName(session.getClassName());
            int totalStudents = 0;
            if (classId != null) {
                totalStudents = studentMapper.countByClassId(classId);
            }
            
            if (totalStudents > 0) {
                double rate = (double) attendedStudents / totalStudents * 100;
                totalAttendanceRate += rate;
                validSessions++;
            }
        }
        
        double averageRate = validSessions > 0 ? totalAttendanceRate / validSessions : 0;

        stats.put("totalCourses", totalCourses);
        stats.put("todayAttendance", todayAttendance);
        stats.put("averageAttendanceRate", String.format("%.1f%%", averageRate));

        return stats;
    }

    @Override
    public Map<String, Object> getCurrentAttendanceByStudent(Long studentId) {
        // 查询当前进行中的签到会话
        List<AttendanceSession> sessions = attendanceSessionMapper.selectActiveSessions();
        if (sessions.isEmpty()) {
            return null;
        }
        
        // 取第一个进行中的会话
        AttendanceSession session = sessions.get(0);
        
        // 计算剩余时间
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = session.getEndTime();
        long remainingSeconds = ChronoUnit.SECONDS.between(now, endTime);
        remainingSeconds = Math.max(remainingSeconds, 0);
        
        // 构建返回数据
        Map<String, Object> currentAttendance = new HashMap<>();
        currentAttendance.put("sessionId", session.getId());
        currentAttendance.put("sessionCode", session.getSessionCode());
        currentAttendance.put("courseName", session.getCourseName());
        currentAttendance.put("className", session.getClassName());
        currentAttendance.put("date", session.getCreateTime().toLocalDate().toString());
        currentAttendance.put("startTime", session.getCreateTime().toLocalTime().toString());
        currentAttendance.put("endTime", session.getEndTime().toLocalTime().toString());
        currentAttendance.put("remainingSeconds", remainingSeconds);
        currentAttendance.put("status", session.getStatus());
        currentAttendance.put("attendanceType", session.getAttendanceType());
        currentAttendance.put("longitude", session.getLongitude());
        currentAttendance.put("latitude", session.getLatitude());
        currentAttendance.put("radius", session.getRadius());
        
        return currentAttendance;
    }

    @Override
    public List<Map<String, Object>> getRecentAttendanceByStudent(Long studentId) {
        // 查询学生最近的签到记录
        List<AttendanceRecord> records = attendanceRecordMapper.selectRecentByStudentId(studentId, 5);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (AttendanceRecord record : records) {
            // 查询对应的签到会话
            AttendanceSession session = attendanceSessionMapper.selectByPrimaryKey(record.getSessionId());
            if (session == null) continue;
            
            Map<String, Object> item = new HashMap<>();
            item.put("id", record.getId());
            item.put("courseName", session.getCourseName());
            item.put("className", session.getClassName());
            item.put("date", session.getCreateTime().toLocalDate().toString());
            item.put("isSigned", true);
            item.put("signTime", record.getSignTime().toLocalTime().toString());
            item.put("status", record.getStatus());
            
            result.add(item);
        }
        
        return result;
    }

    @Override
    public Map<String, Object> getAttendanceStatsByStudent(Long studentId) {
        Map<String, Object> stats = new HashMap<>();
        
        // 查询学生的所有签到记录
        List<AttendanceRecord> records = attendanceRecordMapper.selectByStudentId(studentId);
        
        // 统计总签到次数
        int totalAttendances = records.size();
        
        // 统计迟到次数
        int lateCount = (int) records.stream()
                .filter(record -> record.getStatus() == 2) // 假设2表示迟到
                .count();
        
        // 计算出勤率
        int totalSessions = 50; // TODO: 从数据库查询学生应该参加的总签到次数
        double attendanceRate = totalSessions > 0 ? (double) totalAttendances / totalSessions * 100 : 0;
        
        stats.put("totalAttendances", totalAttendances);
        stats.put("attendanceRate", String.format("%.1f%%", attendanceRate));
        stats.put("lateCount", lateCount);
        
        return stats;
    }
    
    @Override
    /**
     * 根据学生ID和课程名称获取学生的出勤统计信息
     * @param studentId 学生ID
     * @param courseName 课程名称
     * @return 包含出勤统计信息的Map，包括总次数、出勤次数、迟到次数、请假次数、缺勤次数和出勤率
     */
    public Map<String, Object> getAttendanceStatsByStudentAndCourse(Long studentId, String courseName) {
        // 创建用于存储结果Map
        Map<String, Object> result = new HashMap<>();

        // 使用新增的Mapper方法获取统计数据
        Map<String, Object> stats = attendanceRecordMapper.selectStatsByStudentIdAndCourseName(
            studentId,
            courseName
        );

        // 确保统计数据不为空
        if (stats == null) {
            stats = new HashMap<>();
            stats.put("attendanceCount", 0);
            stats.put("lateCount", 0);
            stats.put("leaveCount", 0);
            stats.put("absentCount", 0);
            stats.put("totalCount", 0);
        }

        // 计算出勤率
        // 使用更安全的方式获取统计数据，避免空指针异常
        int totalCount = 0;
        int attendanceCount = 0;
        int lateCount = 0;
        int leaveCount = 0;
        int absentCount = 0;
        
        // 安全获取总次数
        Object totalCountObj = stats.get("totalCount");
        if (totalCountObj != null) {
            if (totalCountObj instanceof Number) {
                totalCount = ((Number) totalCountObj).intValue();
            } else {
                try {
                    totalCount = Integer.parseInt(totalCountObj.toString());
                } catch (NumberFormatException e) {
                    totalCount = 0;
                }
            }
        }
        
        // 安全获取出勤次数
        Object attendanceCountObj = stats.get("attendanceCount");
        if (attendanceCountObj != null) {
            if (attendanceCountObj instanceof Number) {
                attendanceCount = ((Number) attendanceCountObj).intValue();
            } else {
                try {
                    attendanceCount = Integer.parseInt(attendanceCountObj.toString());
                } catch (NumberFormatException e) {
                    attendanceCount = 0;
                }
            }
        }
        
        // 安全获取迟到次数
        Object lateCountObj = stats.get("lateCount");
        if (lateCountObj != null) {
            if (lateCountObj instanceof Number) {
                lateCount = ((Number) lateCountObj).intValue();
            } else {
                try {
                    lateCount = Integer.parseInt(lateCountObj.toString());
                } catch (NumberFormatException e) {
                    lateCount = 0;
                }
            }
        }
        
        // 安全获取请假次数
        Object leaveCountObj = stats.get("leaveCount");
        if (leaveCountObj != null) {
            if (leaveCountObj instanceof Number) {
                leaveCount = ((Number) leaveCountObj).intValue();
            } else {
                try {
                    leaveCount = Integer.parseInt(leaveCountObj.toString());
                } catch (NumberFormatException e) {
                    leaveCount = 0;
                }
            }
        }
        
        // 安全获取缺勤次数
        Object absentCountObj = stats.get("absentCount");
        if (absentCountObj != null) {
            if (absentCountObj instanceof Number) {
                absentCount = ((Number) absentCountObj).intValue();
            } else {
                try {
                    absentCount = Integer.parseInt(absentCountObj.toString());
                } catch (NumberFormatException e) {
                    absentCount = 0;
                }
            }
        }
        
        double attendanceRate = totalCount > 0 ? (double) attendanceCount / totalCount * 100 : 0;

        // 构建返回结果
        result.put("totalCount", totalCount);
        result.put("attendanceCount", attendanceCount);
        result.put("lateCount", lateCount);
        result.put("leaveCount", leaveCount);
        result.put("absentCount", absentCount);
        result.put("attendanceRate", String.format("%.2f%%", attendanceRate));

        return result;
    }

    @Override
    public List<Map<String, Object>> getAttendanceRecordsByStudent(Long studentId, Integer year, Integer month) {
        // 查询指定年月的签到记录
        List<AttendanceRecord> records = attendanceRecordMapper.selectByStudentIdAndMonth(studentId, year, month);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (AttendanceRecord record : records) {
            // 查询对应的签到会话
            AttendanceSession session = attendanceSessionMapper.selectByPrimaryKey(record.getSessionId());
            if (session == null) continue;
            
            Map<String, Object> item = new HashMap<>();
            item.put("id", record.getId());
            item.put("date", session.getCreateTime().toLocalDate().toString());
            item.put("courseName", session.getCourseName());
            item.put("status", record.getStatus() == 1 ? "正常" : record.getStatus() == 2 ? "迟到" : "缺席");
            item.put("signTime", record.getSignTime().toLocalTime().toString());
            
            result.add(item);
        }
        
        return result;
    }

    @Override
    public Map<String, Object> endAttendance(String sessionCode) {
        Map<String, Object> result = new HashMap<>();

        // 从数据库查询签到会话
        AttendanceSession session = attendanceSessionMapper.selectBySessionCode(sessionCode);
        if (session == null) {
            result.put("code", 404);
            result.put("message", "签到会话不存在");
            return result;
        }

        if (session.getStatus() != 1) {
            result.put("code", 400);
            result.put("message", "签到已结束或已关闭");
            return result;
        }

        // 更新签到会话状态为已结束
        session.setStatus(2); // 2: 已结束
        session.setEndTime(LocalDateTime.now());
        session.setUpdateTime(LocalDateTime.now());
        attendanceSessionMapper.updateById(session);

        // 删除Redis中的会话信息
        String sessionKey = SESSION_PREFIX + sessionCode;
        redisTemplate.delete(sessionKey);

        // 自动为未签到的学生创建缺勤记录
        recordAbsentStudents(session);

        result.put("code", 200);
        result.put("message", "签到已结束");
        result.put("data", Map.of(
                "sessionCode", sessionCode,
                "courseName", session.getCourseName(),
                "className", session.getClassName(),
                "endTime", session.getEndTime()
        ));

        return result;
    }
    
    /**
     * 为未签到的学生自动创建缺勤记录
     * @param session 签到会话
     */
    private void recordAbsentStudents(AttendanceSession session) {
        try {
            // 1. 根据班级名称查询班级ID
            Long classId = classMapper.selectIdByClassName(session.getClassName());
            if (classId == null) {
                System.out.println("警告：找不到班级ID，班级名称：" + session.getClassName());
                return;
            }
            
            // 2. 查询该班级的所有学生
            List<Student> students = studentMapper.selectByClassId(classId);
            if (students == null || students.isEmpty()) {
                System.out.println("警告：班级中没有学生，班级ID：" + classId);
                return;
            }
            
            // 3. 查询已签到的学生ID列表
            List<AttendanceRecord> signedRecords = attendanceRecordMapper.selectBySessionId(session.getId());
            List<Long> signedStudentIds = signedRecords.stream()
                    .map(AttendanceRecord::getStudentId)
                    .collect(Collectors.toList());
            
            // 4. 为未签到的学生创建缺勤记录
            int absentCount = 0;
            int errorCount = 0;
            LocalDateTime now = LocalDateTime.now();
            
            for (Student student : students) {
                // 检查学生是否已签到
                if (!signedStudentIds.contains(student.getId())) {
                    try {
                        // 再次检查是否已存在记录（防止并发情况下的重复插入）
                        AttendanceRecord existingRecord = attendanceRecordMapper.selectBySessionIdAndStudentId(
                            session.getId(), student.getId()
                        );
                        if (existingRecord != null) {
                            // 如果已存在记录，跳过
                            continue;
                        }
                        
                        // 创建缺勤记录
                        AttendanceRecord absentRecord = new AttendanceRecord();
                        absentRecord.setSessionId(session.getId());
                        absentRecord.setSessionCode(session.getSessionCode());
                        absentRecord.setStudentId(student.getId());
                        absentRecord.setStudentNo(student.getStudentNo());
                        absentRecord.setStudentName(student.getName());
                        absentRecord.setCourseName(session.getCourseName());
                        absentRecord.setClassName(session.getClassName());
                        // 缺勤记录不记录位置信息，设置为0
                        absentRecord.setLongitude(0.0);
                        absentRecord.setLatitude(0.0);
                        absentRecord.setStatus(4); // 4: 缺勤
                        absentRecord.setSignTime(session.getEndTime()); // 使用签到结束时间作为缺勤时间
                        absentRecord.setCreateTime(now);
                        absentRecord.setUpdateTime(now);
                        
                        // 保存缺勤记录
                        attendanceRecordMapper.insert(absentRecord);
                        absentCount++;
                    } catch (Exception e) {
                        // 单个学生记录插入失败不影响其他学生
                        errorCount++;
                        System.err.println("创建缺勤记录失败，学生ID：" + student.getId() + "，错误：" + e.getMessage());
                    }
                }
            }
            
            System.out.println("签到结束，自动记录缺勤：" + absentCount + " 名学生");
            if (errorCount > 0) {
                System.err.println("创建缺勤记录时发生错误：" + errorCount + " 条记录");
            }
        } catch (Exception e) {
            // 记录错误但不影响签到结束流程
            System.err.println("自动记录缺勤时发生错误：" + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public List<String> getTeacherCourses(Long teacherId) {
        // 直接从数据库课程表中查询教师的课程列表
        List<Course> courses = courseMapper.selectByTeacherId(teacherId);
        // 提取不重复的课程名称
        return courses.stream()
                .map(Course::getCourseName)
                .distinct()
                .filter(Objects::nonNull)
                .filter(course -> !course.isEmpty())
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getTeacherClasses(Long teacherId) {
        // 1. 获取教师的所有课程
        List<Course> courses = courseMapper.selectByTeacherId(teacherId);
        if (courses.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 2. 获取这些课程的ID列表
        List<Long> courseIds = courses.stream()
                .map(Course::getId)
                .collect(Collectors.toList());
        
        // 3. 查询这些课程关联的班级
        List<CourseClass> courseClasses = courseClassMapper.selectByCourseIds(courseIds);
        if (courseClasses.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 4. 获取班级ID列表
        List<Long> classIds = courseClasses.stream()
                .map(CourseClass::getClassId)
                .distinct()
                .collect(Collectors.toList());
        
        // 5. 查询班级详情
        List<Clazz> classes = classMapper.selectByIds(classIds);
        
        // 6. 提取不重复的班级名称
        return classes.stream()
                .map(Clazz::getClassName)
                .distinct()
                .filter(Objects::nonNull)
                .filter(className -> !className.isEmpty())
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getAttendanceStatus(String sessionCode) {
        Map<String, Object> result = new HashMap<>();
        
        // 查询签到会话
        AttendanceSession session = attendanceSessionMapper.selectBySessionCode(sessionCode);
        if (session == null) {
            result.put("code", 404);
            result.put("message", "签到会话不存在");
            return result;
        }
        
        // 检查是否应该自动结束签到
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = session.getEndTime();
        int remainingSeconds = 0;
        
        // 如果签到状态是进行中且当前时间超过结束时间，则自动结束签到
        if (session.getStatus() == 1 && now.isAfter(endTime)) {
            // 更新签到会话状态为已结束
            session.setStatus(2); // 2: 已结束
            session.setEndTime(now); // 更新结束时间为当前时间
            session.setUpdateTime(LocalDateTime.now());
            attendanceSessionMapper.updateById(session);
            
            // 删除Redis中的会话信息
            String sessionKey = SESSION_PREFIX + sessionCode;
            redisTemplate.delete(sessionKey);
            
            // 自动为未签到的学生创建缺勤记录
            recordAbsentStudents(session);
        } else if (session.getStatus() == 1) {
            // 计算剩余时间（秒）
            remainingSeconds = (int) java.time.Duration.between(now, endTime).getSeconds();
            // 确保剩余时间不会为负数
            remainingSeconds = Math.max(remainingSeconds, 0);
        }
        
        // 统计已签到人数
        int attendanceCount = attendanceRecordMapper.countBySessionId(session.getId());
        
        // TODO: 从数据库查询该班级的实际学生总数
        int totalStudents = 50;
        
        // 计算出勤率
        int attendancePercentage = totalStudents > 0 ? Math.round((attendanceCount / (float) totalStudents) * 100) : 0;
        
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", Map.of(
                "sessionCode", sessionCode,
                "attendanceCount", attendanceCount,
                "totalStudents", totalStudents,
                "attendancePercentage", attendancePercentage,
                "status", session.getStatus(),
                "endTime", session.getEndTime(),
                "remainingSeconds", remainingSeconds,
                "isEnded", session.getStatus() != 1
        ));
        
        return result;
    }

    @Override
    public Map<String, Object> refreshQRCode(String sessionCode) {
        Map<String, Object> result = new HashMap<>();
        
        // 查询签到会话
        AttendanceSession session = attendanceSessionMapper.selectBySessionCode(sessionCode);
        if (session == null) {
            result.put("code", 404);
            result.put("message", "签到会话不存在");
            return result;
        }
        
        // 生成新token
        String newToken = UUID.randomUUID().toString().replace("-", "");
        
        // 保存新token到Redis，过期时间60秒
        redisTemplate.opsForValue().set(TOKEN_PREFIX + newToken, sessionCode, TOKEN_TTL, TimeUnit.SECONDS);
        
        // 生成新的二维码，包含新token
        String qrCode = generateQRCode(newToken);
        
        result.put("code", 200);
        result.put("message", "二维码已刷新");
        result.put("data", Map.of(
                "sessionCode", sessionCode,
                "qrCode", qrCode
        ));
        
        return result;
    }

    @Override
    public Map<String, Object> getSessionInfo(String sessionCode) {
        Map<String, Object> result = new HashMap<>();
        
        // 查询签到会话
        AttendanceSession session = attendanceSessionMapper.selectBySessionCode(sessionCode);
        if (session == null) {
            result.put("code", 404);
            result.put("message", "签到会话不存在");
            return result;
        }
        
        // 检查是否应该自动结束签到
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = session.getEndTime();
        int remainingSeconds = 0;
        
        // 如果签到状态是进行中且当前时间超过结束时间，则自动结束签到
        if (session.getStatus() == 1 && now.isAfter(endTime)) {
            // 更新签到会话状态为已结束
            session.setStatus(2); // 2: 已结束
            session.setEndTime(now); // 更新结束时间为当前时间
            session.setUpdateTime(LocalDateTime.now());
            attendanceSessionMapper.updateById(session);
            
            // 删除Redis中的会话信息
            String sessionKey = SESSION_PREFIX + sessionCode;
            redisTemplate.delete(sessionKey);
            
            // 自动为未签到的学生创建缺勤记录
            recordAbsentStudents(session);
        } else if (session.getStatus() == 1) {
            // 计算剩余时间（秒）
            remainingSeconds = (int) java.time.Duration.between(now, endTime).getSeconds();
            // 确保剩余时间不会为负数
            remainingSeconds = Math.max(remainingSeconds, 0);
        }
        
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", Map.ofEntries(
                Map.entry("sessionCode", sessionCode),
                Map.entry("courseName", session.getCourseName()),
                Map.entry("className", session.getClassName()),
                Map.entry("attendanceType", session.getAttendanceType()),
                Map.entry("longitude", session.getLongitude()),
                Map.entry("latitude", session.getLatitude()),
                Map.entry("radius", session.getRadius()),
                Map.entry("status", session.getStatus()),
                Map.entry("endTime", session.getEndTime()),
                Map.entry("remainingSeconds", remainingSeconds),
                Map.entry("isEnded", session.getStatus() != 1)
        ));
        return result;
    }

    @Override
    public Map<String, Object> getSessionStudentDetails(Long sessionId) {
        Map<String, Object> result = new HashMap<>();
        
        // 查询签到会话
        AttendanceSession session = attendanceSessionMapper.selectByPrimaryKey(sessionId);
        if (session == null) {
            result.put("code", 404);
            result.put("message", "签到会话不存在");
            return result;
        }
        
        // 查询该会话的所有签到记录
        List<AttendanceRecord> records = attendanceRecordMapper.selectBySessionId(sessionId);
        
        // 根据班级名称查询班级ID
        Long classId = classMapper.selectIdByClassName(session.getClassName());
        if (classId == null) {
            result.put("code", 404);
            result.put("message", "班级不存在");
            return result;
        }
        
        // 查询该班级的所有学生
        List<Student> allStudents = studentMapper.selectByClassId(classId);
        
        // 构建正常签到学生列表
        List<Map<String, Object>> attendedStudents = new ArrayList<>();
        for (AttendanceRecord record : records) {
            if (record.getStatus() == 1) { // 正常签到
                Map<String, Object> studentInfo = new HashMap<>();
                studentInfo.put("studentId", record.getStudentId());
                studentInfo.put("studentNo", record.getStudentNo());
                studentInfo.put("studentName", record.getStudentName());
                studentInfo.put("signTime", record.getSignTime());
                studentInfo.put("status", "正常签到");
                attendedStudents.add(studentInfo);
            }
        }
        
        // 构建未签到学生列表（包括缺勤、迟到、请假）
        List<Map<String, Object>> absentStudents = new ArrayList<>();
        for (Student student : allStudents) {
            // 查找该学生的签到记录
            AttendanceRecord studentRecord = records.stream()
                    .filter(record -> record.getStudentId().equals(student.getId()))
                    .findFirst()
                    .orElse(null);
            
            if (studentRecord == null) {
                // 没有记录，说明是缺勤
                Map<String, Object> studentInfo = new HashMap<>();
                studentInfo.put("studentId", student.getId());
                studentInfo.put("studentNo", student.getStudentNo());
                studentInfo.put("studentName", student.getName());
                studentInfo.put("status", "未签到");
                absentStudents.add(studentInfo);
            } else if (studentRecord.getStatus() == 4) {
                // 状态为4，缺勤
                Map<String, Object> studentInfo = new HashMap<>();
                studentInfo.put("studentId", student.getId());
                studentInfo.put("studentNo", student.getStudentNo());
                studentInfo.put("studentName", student.getName());
                studentInfo.put("status", "未签到");
                absentStudents.add(studentInfo);
            } else if (studentRecord.getStatus() == 2) {
                // 状态为2，迟到
                Map<String, Object> studentInfo = new HashMap<>();
                studentInfo.put("studentId", student.getId());
                studentInfo.put("studentNo", student.getStudentNo());
                studentInfo.put("studentName", student.getName());
                studentInfo.put("status", "迟到");
                absentStudents.add(studentInfo);
            } else if (studentRecord.getStatus() == 3) {
                // 状态为3，请假
                Map<String, Object> studentInfo = new HashMap<>();
                studentInfo.put("studentId", student.getId());
                studentInfo.put("studentNo", student.getStudentNo());
                studentInfo.put("studentName", student.getName());
                studentInfo.put("status", "请假");
                absentStudents.add(studentInfo);
            }
        }
        
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", Map.of(
                "sessionId", sessionId,
                "courseName", session.getCourseName(),
                "className", session.getClassName(),
                "startTime", session.getStartTime(),
                "endTime", session.getEndTime(),
                "attendedStudents", attendedStudents,
                "absentStudents", absentStudents
        ));
        
        return result;
    }

    @Override
    public Map<String, Object> updateStudentAttendanceStatus(Long sessionId, Long studentId, Integer status) {
        Map<String, Object> result = new HashMap<>();
        
        // 验证状态值（2:迟到, 3:请假）
        if (status == null || (status != 2 && status != 3)) {
            result.put("code", 400);
            result.put("message", "无效的状态值，只能设置为迟到(2)或请假(3)");
            return result;
        }
        
        // 查询签到会话
        AttendanceSession session = attendanceSessionMapper.selectByPrimaryKey(sessionId);
        if (session == null) {
            result.put("code", 404);
            result.put("message", "签到会话不存在");
            return result;
        }
        
        // 查询学生信息
        Student student = studentMapper.findById(studentId);
        if (student == null) {
            result.put("code", 404);
            result.put("message", "学生不存在");
            return result;
        }
        
        // 查询是否已存在签到记录
        AttendanceRecord existingRecord = attendanceRecordMapper.selectBySessionIdAndStudentId(sessionId, studentId);
        LocalDateTime now = LocalDateTime.now();
        
        if (existingRecord != null) {
            // 如果记录已存在，更新状态
            existingRecord.setStatus(status);
            existingRecord.setSignTime(session.getEndTime()); // 使用签到结束时间
            existingRecord.setUpdateTime(now);
            // 使用updateById更新记录
            attendanceRecordMapper.updateById(existingRecord);
        } else {
            // 如果记录不存在，创建新记录
            AttendanceRecord record = new AttendanceRecord();
            record.setSessionId(sessionId);
            record.setSessionCode(session.getSessionCode());
            record.setStudentId(studentId);
            record.setStudentNo(student.getStudentNo());
            record.setStudentName(student.getName());
            record.setCourseName(session.getCourseName());
            record.setClassName(session.getClassName());
            record.setLongitude(0.0);
            record.setLatitude(0.0);
            record.setStatus(status);
            record.setSignTime(session.getEndTime()); // 使用签到结束时间
            record.setCreateTime(now);
            record.setUpdateTime(now);
            attendanceRecordMapper.insert(record);
        }
        
        result.put("code", 200);
        result.put("message", status == 2 ? "已标记为迟到" : "已标记为请假");
        return result;
    }
}