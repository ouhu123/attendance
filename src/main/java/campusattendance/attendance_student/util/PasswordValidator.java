package campusattendance.attendance_student.util;

import java.util.regex.Pattern;

/**
 * 密码验证工具类
 * 验证密码是否符合要求：6-12位，包含数字和大小写字母
 */
public class PasswordValidator {
    
    // 密码正则表达式：6-12位，包含数字和大小写字母
    private static final String PASSWORD_PATTERN = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,12}$";
    private static final Pattern PATTERN = Pattern.compile(PASSWORD_PATTERN);
    
    /**
     * 验证密码是否符合要求
     * @param password 密码
     * @return 是否符合要求
     */
    public static boolean isValid(String password) {
        if (password == null) {
            return false;
        }
        return PATTERN.matcher(password).matches();
    }
    
    /**
     * 获取密码验证失败的提示信息
     * @param password 密码
     * @return 提示信息，若密码有效则返回null
     */
    public static String getErrorMessage(String password) {
        if (password == null) {
            return "密码不能为空";
        }
        if (password.length() < 6 || password.length() > 12) {
            return "密码长度必须为6-12位";
        }
        if (!password.matches(".*[0-9].*")) {
            return "密码必须包含数字";
        }
        if (!password.matches(".*[a-z].*")) {
            return "密码必须包含小写字母";
        }
        if (!password.matches(".*[A-Z].*")) {
            return "密码必须包含大写字母";
        }
        return null;
    }
}