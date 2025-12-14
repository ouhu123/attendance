package campusattendance.attendance_student.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/hello")
    public Map<String, Object> hello() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "Hello from TestController!");
        return result;
    }

    @PostMapping("/test-post")
    public Map<String, Object> testPost() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "POST request received!");
        return result;
    }
}