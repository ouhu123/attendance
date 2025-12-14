package campusattendance.attendance_student.mapper;

import campusattendance.attendance_student.model.Course;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 课程Mapper接口
 */
@Mapper
public interface CourseMapper {
    /**
     * 根据教师ID查询课程列表
     * @param teacherId 教师ID
     * @return 课程列表
     */
    List<Course> selectByTeacherId(@Param("teacherId") Long teacherId);
}