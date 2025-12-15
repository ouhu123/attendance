package campusattendance.attendance_student.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.web.filter.GenericFilterBean;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * CORS跨域配置
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // 禁用此方法，避免与WebConfig.java中的CORS配置冲突
    // 所有CORS配置已移至WebConfig.java
    /*
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 允许所有请求路径
        registry.addMapping("/**")
                // 允许所有来源域名（使用allowedOriginPatterns替代allowedOrigins以支持通配符和credentials）
                .allowedOriginPatterns("*")
                // 允许的请求方法
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // 允许的请求头
                .allowedHeaders("*")
                // 允许暴露响应头
                .exposedHeaders("Authorization", "Cross-Origin-Embedder-Policy", "Cross-Origin-Opener-Policy")
                // 是否允许发送Cookie
                .allowCredentials(true)
                // 预检请求的有效期（秒）
                .maxAge(3600);
    }
    */

    // 添加跨源隔离的HTTP头过滤器
    @Bean
    public Filter crossOriginIsolationFilter() {
        return new GenericFilterBean() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
                    throws IOException, ServletException {
                HttpServletResponse httpResponse = (HttpServletResponse) response;
                // 设置跨源隔离头，解决SharedArrayBuffer警告
                httpResponse.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                httpResponse.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                chain.doFilter(request, response);
            }
        };
    }
}