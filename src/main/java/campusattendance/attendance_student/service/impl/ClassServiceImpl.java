package campusattendance.attendance_student.service.impl;

import campusattendance.attendance_student.mapper.ClassMapper;
import campusattendance.attendance_student.model.Clazz;
import campusattendance.attendance_student.service.ClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 班级Service实现类
 */
@Service
public class ClassServiceImpl implements ClassService {
    
    @Autowired
    private ClassMapper classMapper;
    
    @Override
    public List<Clazz> getAllClasses() {
        return classMapper.selectAll();
    }
    
    @Override
    public Clazz getClassById(Long id) {
        return classMapper.selectById(id);
    }
    
    @Override
    public Map<String, Object> addClass(Clazz clazz) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 验证班级信息
            if (clazz == null || clazz.getClassName() == null || clazz.getClassName().isEmpty()) {
                result.put("code", 400);
                result.put("message", "班级名称不能为空");
                return result;
            }
            
            int rows = classMapper.insert(clazz);
            if (rows > 0) {
                result.put("code", 200);
                result.put("message", "班级添加成功");
                result.put("data", clazz);
            } else {
                result.put("code", 500);
                result.put("message", "班级添加失败");
            }
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", "班级添加失败：" + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> updateClass(Clazz clazz) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 验证班级信息
            if (clazz == null || clazz.getId() == null) {
                result.put("code", 400);
                result.put("message", "班级ID不能为空");
                return result;
            }
            
            if (clazz.getClassName() == null || clazz.getClassName().isEmpty()) {
                result.put("code", 400);
                result.put("message", "班级名称不能为空");
                return result;
            }
            
            // 检查班级是否存在
            Clazz existingClass = classMapper.selectById(clazz.getId());
            if (existingClass == null) {
                result.put("code", 404);
                result.put("message", "班级不存在");
                return result;
            }
            
            int rows = classMapper.updateById(clazz);
            if (rows > 0) {
                result.put("code", 200);
                result.put("message", "班级更新成功");
                result.put("data", clazz);
            } else {
                result.put("code", 500);
                result.put("message", "班级更新失败");
            }
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", "班级更新失败：" + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> deleteClass(Long id) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 验证班级ID
            if (id == null) {
                result.put("code", 400);
                result.put("message", "班级ID不能为空");
                return result;
            }
            
            // 检查班级是否存在
            Clazz existingClass = classMapper.selectById(id);
            if (existingClass == null) {
                result.put("code", 404);
                result.put("message", "班级不存在");
                return result;
            }
            
            int rows = classMapper.deleteById(id);
            if (rows > 0) {
                result.put("code", 200);
                result.put("message", "班级删除成功");
            } else {
                result.put("code", 500);
                result.put("message", "班级删除失败");
            }
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", "班级删除失败：" + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public List<Map<String, Object>> getClassDetails() {
        return classMapper.selectClassDetails();
    }
    
    @Override
    public List<Map<String, Object>> getClassDetailsByTeacherId(Long teacherId) {
        if (teacherId == null) {
            return List.of();
        }
        List<Map<String, Object>> classDetails = classMapper.selectClassDetailsByTeacherId(teacherId);
        
        // 确保每个班级都有 courseNames 字段，即使为空
        for (Map<String, Object> classDetail : classDetails) {
            // 如果 courseNames 不存在或为 null，设置为空字符串
            if (!classDetail.containsKey("courseNames") || classDetail.get("courseNames") == null) {
                classDetail.put("courseNames", "");
            }
            // 确保 courseNames 是字符串类型
            Object courseNames = classDetail.get("courseNames");
            if (courseNames != null && !(courseNames instanceof String)) {
                classDetail.put("courseNames", String.valueOf(courseNames));
            }
        }
        
        return classDetails;
    }
    
    @Override
    public List<Map<String, Object>> getStudentsWithAttendanceStats(Long classId) {
        if (classId == null) {
            return List.of();
        }
        List<Map<String, Object>> students = classMapper.selectStudentsWithAttendanceStats(classId);
        
        // 确保每个学生都有统计字段，即使为null也设置为0
        for (Map<String, Object> student : students) {
            if (student.get("attendanceCount") == null) {
                student.put("attendanceCount", 0);
            }
            if (student.get("lateCount") == null) {
                student.put("lateCount", 0);
            }
            if (student.get("leaveCount") == null) {
                student.put("leaveCount", 0);
            }
            if (student.get("absentCount") == null) {
                student.put("absentCount", 0);
            }
        }
        
        return students;
    }
    
    @Override
    public List<Map<String, Object>> getCoursesByClassId(Long classId) {
        if (classId == null) {
            return List.of();
        }
        return classMapper.selectCoursesByClassId(classId);
    }
    
    @Override
    public List<Map<String, Object>> getClassDetailsByStudentId(Long studentId) {
        if (studentId == null) {
            return List.of();
        }
        List<Map<String, Object>> classDetails = classMapper.selectClassDetailsByStudentId(studentId);
        
        // 确保每个班级都有 courseNames 字段，即使为空
        for (Map<String, Object> classDetail : classDetails) {
            // 如果 courseNames 不存在或为 null，设置为空字符串
            if (!classDetail.containsKey("courseNames") || classDetail.get("courseNames") == null) {
                classDetail.put("courseNames", "");
            }
            // 确保 courseNames 是字符串类型
            Object courseNames = classDetail.get("courseNames");
            if (courseNames != null && !(courseNames instanceof String)) {
                classDetail.put("courseNames", String.valueOf(courseNames));
            }
        }
        
        return classDetails;
    }
}