package campusattendance.attendance_student.mapper;

import campusattendance.attendance_student.model.AttendanceSession;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 签到会话Mapper
 */
@Mapper
public interface AttendanceSessionMapper {
    /**
     * 创建签到会话
     * @param attendanceSession 签到会话
     * @return 影响行数
     */
    int insert(AttendanceSession attendanceSession);

    /**
     * 根据会话码查询签到会话
     * @param sessionCode 会话码
     * @return 签到会话
     */
    AttendanceSession selectBySessionCode(String sessionCode);

    /**
     * 根据ID更新签到会话
     * @param attendanceSession 签到会话
     * @return 影响行数
     */
    int updateById(AttendanceSession attendanceSession);

    /**
     * 根据教师ID查询签到会话列表
     * @param teacherId 教师ID
     * @return 签到会话列表
     */
    List<AttendanceSession> selectByTeacherId(Long teacherId);
    
    /**
     * 查询当前进行中的签到会话
     * @return 签到会话列表
     */
    List<AttendanceSession> selectActiveSessions();
    
    /**
     * 根据ID查询签到会话
     * @param id ID
     * @return 签到会话
     */
    AttendanceSession selectByPrimaryKey(Long id);
}