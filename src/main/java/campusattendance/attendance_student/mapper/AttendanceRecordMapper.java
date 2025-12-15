package campusattendance.attendance_student.mapper;

import campusattendance.attendance_student.model.AttendanceRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 签到记录Mapper
 */
@Mapper
public interface AttendanceRecordMapper {
    /**
     * 创建签到记录
     * @param attendanceRecord 签到记录
     * @return 影响行数
     */
    int insert(AttendanceRecord attendanceRecord);
    
    /**
     * 更新签到记录
     * @param attendanceRecord 签到记录
     * @return 影响行数
     */
    int updateById(AttendanceRecord attendanceRecord);

    /**
     * 根据会话ID和学生ID查询签到记录
     * @param sessionId 会话ID
     * @param studentId 学生ID
     * @return 签到记录
     */
    AttendanceRecord selectBySessionIdAndStudentId(Long sessionId, Long studentId);

    /**
     * 根据会话ID查询签到记录列表
     * @param sessionId 会话ID
     * @return 签到记录列表
     */
    List<AttendanceRecord> selectBySessionId(Long sessionId);
    
    /**
     * 根据会话ID统计签到人数
     * @param sessionId 会话ID
     * @return 签到人数
     */
    int countBySessionId(Long sessionId);
    
    /**
     * 查询学生最近的签到记录
     * @param studentId 学生ID
     * @param limit 限制数量
     * @return 签到记录列表
     */
    List<AttendanceRecord> selectRecentByStudentId(@Param("studentId") Long studentId, @Param("limit") int limit);
    
    /**
     * 查询学生的所有签到记录
     * @param studentId 学生ID
     * @return 签到记录列表import org.apache.ibatis.annotations.Param;

     */
    List<AttendanceRecord> selectByStudentId(Long studentId);
    
    /**
     * 查询学生在指定年月的签到记录
     * @param studentId 学生ID
     * @param year 年份
     * @param month 月份
     * @return 签到记录列表
     */
    List<AttendanceRecord> selectByStudentIdAndMonth(@Param("studentId") Long studentId, @Param("year") Integer year, @Param("month") Integer month);

/**
 * 根据学生ID和课程名称查询统计数据
 *
 * @param studentId 学生ID，用于指定查询的学生
 * @param courseName 课程名称，用于指定查询的课程
 * @return 返回一个Map集合，包含查询到的统计数据，键为String类型，值为Object类型
 */
 Map<String, Object> selectStatsByStudentIdAndCourseName(@Param("studentId") Long studentId, @Param("courseName") String courseName);
}