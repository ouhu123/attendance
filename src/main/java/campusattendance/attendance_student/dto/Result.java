package campusattendance.attendance_student.dto;

/**
 * 通用响应结果类
 */

public class Result<T> {
    
    // 响应码：200成功，其他失败
    private Integer code;
    
    // 响应消息
    private String message;
    
    // 响应数据
    private T data;

    public Result() {
    }

    public Result(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 成功响应
     * @param data 响应数据
     * @param <T> 数据类型
     * @return 响应结果
     */
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }
    
    /**
     * 成功响应（无数据）
     * @param <T> 数据类型
     * @return 响应结果
     */
    public static <T> Result<T> success() {
        return success(null);
    }
    
    /**
     * 失败响应
     * @param code 响应码
     * @param message 响应消息
     * @param <T> 数据类型
     * @return 响应结果
     */
    public static <T> Result<T> fail(Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        result.setData(null);
        return result;
    }
    
    /**
     * 失败响应（默认响应码400）
     * @param message 响应消息
     * @param <T> 数据类型
     * @return 响应结果
     */
    public static <T> Result<T> fail(String message) {
        return fail(400, message);
    }

    /**
     * 获取
     * @return code
     */
    public Integer getCode() {
        return code;
    }

    /**
     * 设置
     * @param code
     */
    public void setCode(Integer code) {
        this.code = code;
    }

    /**
     * 获取
     * @return message
     */
    public String getMessage() {
        return message;
    }

    /**
     * 设置
     * @param message
     */
    public void setMessage(String message) {
        this.message = message;
    }

    /**
     * 获取
     * @return data
     */
    public T getData() {
        return data;
    }

    /**
     * 设置
     * @param data
     */
    public void setData(T data) {
        this.data = data;
    }

    public String toString() {
        return "Result{code = " + code + ", message = " + message + ", data = " + data + "}";
    }
}