package campusattendance.attendance_student.service.impl;

import campusattendance.attendance_student.mapper.StudentMapper;
import campusattendance.attendance_student.model.Student;
import campusattendance.attendance_student.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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
    
    @Override
    public Student findById(Long studentId) {
        return studentMapper.findById(studentId);
    }
    
    @Override
    public List<Student> getStudentsByClassId(Long classId) {
        return studentMapper.selectByClassId(classId);
    }
    
    @Override
    public boolean updatePassword(Long studentId, String password) {
        int result = studentMapper.updatePassword(studentId, password);
        return result > 0;
    }
}