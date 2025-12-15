package campusattendance.attendance_student.mapper;

import campusattendance.attendance_student.model.Student;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

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
    
    /**
     * 根据ID查询学生信息
     * @param studentId 学生ID
     * @return 学生信息
     */
    Student findById(@Param("studentId") Long studentId);
    
    /**
     * 根据班级ID查询学生列表
     * @param classId 班级ID
     * @return 学生列表
     */
    List<Student> selectByClassId(@Param("classId") Long classId);
    
    /**
     * 根据班级ID统计学生总数
     * @param classId 班级ID
     * @return 学生总数
     */
    int countByClassId(@Param("classId") Long classId);
    
    /**
     * 更新学生密码
     * @param studentId 学生ID
     * @param password 新密码
     * @return 影响行数
     */
    int updatePassword(@Param("studentId") Long studentId, @Param("password") String password);
}