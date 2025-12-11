package campusattendance.attendance_student;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("campusattendance.attendance_student.mapper")
public class AttendanceStudentApplication {

    public static void main(String[] args) {
        SpringApplication.run(AttendanceStudentApplication.class, args);
    }

}