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
}