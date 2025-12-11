package campusattendance.attendance_student.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 登录请求DTO
 */

public class LoginRequest {
    
    // 用户名（12位数字）
    @NotBlank(message = "用户名不能为空")
    @Pattern(regexp = "^\\d{12}$", message = "用户名必须为12位数字")
    @JsonProperty("userNo")
    private String username;
    
    // 密码
    @NotBlank(message = "密码不能为空")
    private String password;
    
    // 用户类型：student或teacher
    @NotBlank(message = "用户类型不能为空")
    @Pattern(regexp = "^(student|teacher)$", message = "用户类型必须为student或teacher")
    @JsonProperty("userType")
    private String type;

    public LoginRequest() {
    }

    public LoginRequest(String username, String password, String type) {
        this.username = username;
        this.password = password;
        this.type = type;
    }

    /**
     * 获取
     * @return username
     */
    public String getUsername() {
        return username;
    }

    /**
     * 设置
     * @param username
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * 获取
     * @return password
     */
    public String getPassword() {
        return password;
    }

    /**
     * 设置
     * @param password
     */
    public void setPassword(String password) {
        this.password = password;
    }

    /**
     * 获取
     * @return type
     */
    public String getType() {
        return type;
    }

    /**
     * 设置
     * @param type
     */
    public void setType(String type) {
        this.type = type;
    }

    public String toString() {
        return "LoginRequest{username = " + username + ", password = " + password + ", type = " + type + "}";
    }
}