package campusattendance.attendance_student.service;

import campusattendance.attendance_student.model.Student;

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
}