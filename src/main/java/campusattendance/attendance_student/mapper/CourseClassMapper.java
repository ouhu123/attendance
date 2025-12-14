package campusattendance.attendance_student.mapper;

import campusattendance.attendance_student.model.CourseClass;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 课程班级关联Mapper接口
 */
@Mapper
public interface CourseClassMapper {
    /**
     * 根据课程ID列表查询课程班级关联列表
     * @param courseIds 课程ID列表
     * @return 课程班级关联列表
     */
    List<CourseClass> selectByCourseIds(@Param("courseIds") List<Long> courseIds);
}