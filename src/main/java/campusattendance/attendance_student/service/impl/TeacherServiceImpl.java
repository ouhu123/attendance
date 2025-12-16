package campusattendance.attendance_student.service.impl;

import campusattendance.attendance_student.mapper.TeacherMapper;
import campusattendance.attendance_student.model.Teacher;
import campusattendance.attendance_student.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 教师Service实现类
 */
@Service
public class TeacherServiceImpl implements TeacherService {
    
    @Autowired
    private TeacherMapper teacherMapper;
    
    @Override
    public Teacher findByTeacherNo(String teacherNo) {
        return teacherMapper.findByTeacherNo(teacherNo);
    }
    
    @Override
    public Teacher findById(Long teacherId) {
        return teacherMapper.findById(teacherId);
    }
    
    @Override
    public boolean updatePassword(Long teacherId, String password) {
        int result = teacherMapper.updatePassword(teacherId, password);
        return result > 0;
    }
    
    @Override
    public boolean updateAvatar(Long teacherId, String avatar) {
        int result = teacherMapper.updateAvatar(teacherId, avatar);
        return result > 0;
    }
}