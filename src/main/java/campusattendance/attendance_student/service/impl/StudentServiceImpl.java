package campusattendance.attendance_student.service.impl;

import campusattendance.attendance_student.mapper.StudentMapper;
import campusattendance.attendance_student.model.Student;
import campusattendance.attendance_student.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 学生Service实现类
 */
@Service
public class StudentServiceImpl implements StudentService {
    
    @Autowired
    private StudentMapper studentMapper;
    
    @Override
    public Student findByStudentNo(String studentNo) {
        return studentMapper.findByStudentNo(studentNo);
    }
}