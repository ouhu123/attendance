package campusattendance.attendance_student.mapper;

import campusattendance.attendance_student.model.Teacher;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 教师Mapper接口
 */
@Mapper
public interface TeacherMapper {
    
    /**
     * 根据工号查询教师信息
     * @param teacherNo 工号
     * @return 教师信息
     */
    Teacher findByTeacherNo(@Param("teacherNo") String teacherNo);
    
    /**
     * 根据ID查询教师信息
     * @param teacherId 教师ID
     * @return 教师信息
     */
    Teacher findById(@Param("teacherId") Long teacherId);
    
    /**
     * 更新教师密码
     * @param teacherId 教师ID
     * @param password 新密码
     * @return 影响行数
     */
    int updatePassword(@Param("teacherId") Long teacherId, @Param("password") String password);
    
    /**
     * 更新教师头像
     * @param teacherId 教师ID
     * @param avatar 头像路径
     * @return 影响行数
     */
    int updateAvatar(@Param("teacherId") Long teacherId, @Param("avatar") String avatar);
}