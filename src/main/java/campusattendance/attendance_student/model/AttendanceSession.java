package campusattendance.attendance_student.model;

import java.time.LocalDateTime;

/**
 * 签到会话实体类
 */
public class AttendanceSession {
    private Long id;
    private String sessionCode;
    private Long teacherId;
    private String teacherNo;
    private String courseName;
    private String className;
    private Double longitude;
    private Double latitude;
    private Integer radius;
    private Integer attendanceType;
    private Integer duration;
    private String gesture;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSessionCode() { return sessionCode; }
    public void setSessionCode(String sessionCode) { this.sessionCode = sessionCode; }
    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }
    public String getTeacherNo() { return teacherNo; }
    public void setTeacherNo(String teacherNo) { this.teacherNo = teacherNo; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Double getLatitude() { return latitude; }    public void setLatitude(Double latitude) { this.latitude = latitude; }    public Integer getRadius() { return radius; }    public void setRadius(Integer radius) { this.radius = radius; }    public Integer getAttendanceType() { return attendanceType; }    public void setAttendanceType(Integer attendanceType) { this.attendanceType = attendanceType; }    public Integer getDuration() { return duration; }    public void setDuration(Integer duration) { this.duration = duration; }    public String getGesture() { return gesture; }    public void setGesture(String gesture) { this.gesture = gesture; }    public LocalDateTime getStartTime() { return startTime; }    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }
}