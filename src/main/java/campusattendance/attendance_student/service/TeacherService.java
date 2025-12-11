package campusattendance.attendance_student.service;

import campusattendance.attendance_student.model.Teacher;

/**
 * 教师Service接口
 */
public interface TeacherService {
    
    /**
     * 根据工号查询教师信息
     * @param teacherNo 工号
     * @return 教师信息
     */
    Teacher findByTeacherNo(String teacherNo);
}