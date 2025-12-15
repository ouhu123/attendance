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
    
    /**
     * 根据ID查询教师信息
     * @param teacherId 教师ID
     * @return 教师信息
     */
    Teacher findById(Long teacherId);
    
    /**
     * 更新教师密码
     * @param teacherId 教师ID
     * @param password 新密码
     * @return 是否更新成功
     */
    boolean updatePassword(Long teacherId, String password);
}