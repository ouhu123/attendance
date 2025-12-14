package campusattendance.attendance_student.model;

/**
 * 课程班级关联实体类
 */
public class CourseClass {
    private Long id;
    private Long courseId;
    private Long classId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }
}