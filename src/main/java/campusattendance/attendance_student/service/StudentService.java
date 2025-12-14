package campusattendance.attendance_student.service;

import campusattendance.attendance_student.model.Student;

import java.util.List;

/**
 * 学生Service接口
 */
public interface StudentService {
    
    /**
     * 根据学号查询学生信息
     * @param studentNo 学号
     * @return 学生信息
     */
    Student findByStudentNo(String studentNo);
    
    /**
     * 根据ID查询学生信息
     * @param studentId 学生ID
     * @return 学生信息
     */
    Student findById(Long studentId);
    
    /**
     * 根据班级ID查询学生列表
     * @param classId 班级ID
     * @return 学生列表
     */
    List<Student> getStudentsByClassId(Long classId);
}