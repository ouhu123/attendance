package campusattendance.attendance_student.dto;

/**
 * 登录响应DTO
 */
public class LoginResponse {
    
    // JWT令牌
    private String token;
    
    // 令牌类型
    private String tokenType = "Bearer";
    
    // 用户ID
    private Long userId;
    
    // 用户名（学号或工号）
    private String username;
    
    // 用户姓名
    private String name;
    
    // 用户角色
    private String role;
    
    // 头像URL
    private String avatar;
    
    /**
     * 构造方法
     * @param token JWT令牌
     * @param userId 用户ID
     * @param username 用户名
     * @param name 用户姓名
     * @param role 用户角色
     * @param avatar 头像URL
     */
    public LoginResponse(String token, Long userId, String username, String name, String role, String avatar) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.name = name;
        this.role = role;
        this.avatar = avatar;
    }

    public LoginResponse() {
    }

    public LoginResponse(String token, String tokenType, Long userId, String username, String name, String role, String avatar) {
        this.token = token;
        this.tokenType = tokenType;
        this.userId = userId;
        this.username = username;
        this.name = name;
        this.role = role;
        this.avatar = avatar;
    }

    /**
     * 获取
     * @return token
     */
    public String getToken() {
        return token;
    }

    /**
     * 设置
     * @param token
     */
    public void setToken(String token) {
        this.token = token;
    }

    /**
     * 获取
     * @return tokenType
     */
    public String getTokenType() {
        return tokenType;
    }

    /**
     * 设置
     * @param tokenType
     */
    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    /**
     * 获取
     * @return userId
     */
    public Long getUserId() {
        return userId;
    }

    /**
     * 设置
     * @param userId
     */
    public void setUserId(Long userId) {
        this.userId = userId;
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
     * @return name
     */
    public String getName() {
        return name;
    }

    /**
     * 设置
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * 获取
     * @return role
     */
    public String getRole() {
        return role;
    }

    /**
     * 设置
     * @param role
     */
    public void setRole(String role) {
        this.role = role;
    }

    /**
     * 获取
     * @return avatar
     */
    public String getAvatar() {
        return avatar;
    }

    /**
     * 设置
     * @param avatar
     */
    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String toString() {
        return "LoginResponse{token = " + token + ", tokenType = " + tokenType + ", userId = " + userId + ", username = " + username + ", name = " + name + ", role = " + role + ", avatar = " + avatar + "}";
    }
}