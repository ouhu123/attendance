package campusattendance.attendance_student.service;

import campusattendance.attendance_student.model.Clazz;

import java.util.List;
import java.util.Map;

/**
 * 班级Service接口
 */
public interface ClassService {
    /**
     * 查询所有班级
     * @return 班级列表
     */
    List<Clazz> getAllClasses();
    
    /**
     * 根据ID查询班级
     * @param id 班级ID
     * @return 班级信息
     */
    Clazz getClassById(Long id);
    
    /**
     * 添加班级
     * @param clazz 班级信息
     * @return 添加结果
     */
    Map<String, Object> addClass(Clazz clazz);
    
    /**
     * 更新班级
     * @param clazz 班级信息
     * @return 更新结果
     */
    Map<String, Object> updateClass(Clazz clazz);
    
    /**
     * 删除班级
     * @param id 班级ID
     * @return 删除结果
     */
    Map<String, Object> deleteClass(Long id);
    
    /**
     * 查询班级详情（包含学生数量和课程数量）
     * @return 班级详情列表
     */
    List<Map<String, Object>> getClassDetails();
    
    /**
     * 根据教师ID查询其教授课程的班级列表及详情
     * @param teacherId 教师ID
     * @return 班级详情列表
     */
    List<Map<String, Object>> getClassDetailsByTeacherId(Long teacherId);
    
    /**
     * 根据班级ID查询班级学生列表及签到统计
     * @param classId 班级ID
     * @return 学生列表及签到统计
     */
    List<Map<String, Object>> getStudentsWithAttendanceStats(Long classId);
    
    /**
     * 根据班级ID查询班级课程列表
     * @param classId 班级ID
     * @return 课程列表
     */
    List<Map<String, Object>> getCoursesByClassId(Long classId);
    
    /**
     * 根据学生ID查询其所在班级信息
     * @param studentId 学生ID
     * @return 班级详情信息
     */
    List<Map<String, Object>> getClassDetailsByStudentId(Long studentId);
}