package campusattendance.attendance_student.mapper;

import campusattendance.attendance_student.model.Clazz;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 班级Mapper接口
 */
@Mapper
public interface ClassMapper {
    /**
     * 根据班级ID列表查询班级列表
     * @param classIds 班级ID列表
     * @return 班级列表
     */
    List<Clazz> selectByIds(@Param("ids") List<Long> classIds);
    
    /**
     * 查询所有班级
     * @return 班级列表
     */
    List<Clazz> selectAll();
    
    /**
     * 根据ID查询班级
     * @param id 班级ID
     * @return 班级信息
     */
    Clazz selectById(@Param("id") Long id);
    
    /**
     * 添加班级
     * @param clazz 班级信息
     * @return 影响行数
     */
    int insert(Clazz clazz);
    
    /**
     * 更新班级
     * @param clazz 班级信息
     * @return 影响行数
     */
    int updateById(Clazz clazz);
    
    /**
     * 删除班级
     * @param id 班级ID
     * @return 影响行数
     */
    int deleteById(@Param("id") Long id);
    
    /**
     * 查询班级详情（包含学生数量和课程数量）
     * @return 班级详情列表
     */
    List<Map<String, Object>> selectClassDetails();
    
    /**
     * 根据教师ID查询其教授课程的班级列表及详情
     * @param teacherId 教师ID
     * @return 班级详情列表
     */
    List<Map<String, Object>> selectClassDetailsByTeacherId(@Param("teacherId") Long teacherId);
    
    /**
     * 根据班级ID查询班级学生列表及签到统计
     * @param classId 班级ID
     * @return 学生列表及签到统计
     */
    List<Map<String, Object>> selectStudentsWithAttendanceStats(@Param("classId") Long classId);
    
    /**
     * 根据班级名称查询班级ID
     * @param className 班级名称
     * @return 班级ID，如果不存在返回null
     */
    Long selectIdByClassName(@Param("className") String className);
    
    /**
     * 根据班级ID查询班级课程列表
     * @param classId 班级ID
     * @return 课程列表
     */
    List<Map<String, Object>> selectCoursesByClassId(@Param("classId") Long classId);
    
    /**
     * 根据学生ID查询其所在班级的详情信息
     * @param studentId 学生ID
     * @return 班级详情信息
     */
    List<Map<String, Object>> selectClassDetailsByStudentId(@Param("studentId") Long studentId);
}