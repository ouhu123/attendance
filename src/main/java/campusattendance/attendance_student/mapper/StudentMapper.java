package campusattendance.attendance_student.mapper;

import campusattendance.attendance_student.model.Student;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 学生Mapper接口
 */
@Mapper
public interface StudentMapper {
    
    /**
     * 根据学号查询学生信息
     * @param studentNo 学号
     * @return 学生信息
     */
    Student findByStudentNo(@Param("studentNo") String studentNo);
}