package campusattendance.attendance_student.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.http.HttpHeaders;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // 移除addCorsMappings方法，避免与corsFilter Bean冲突
    // 所有CORS配置已在corsFilter Bean中完成
    /*
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
    */

    // 添加跨源隔离的HTTP头过滤器
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        // 添加跨源隔离头
        config.addExposedHeader("Cross-Origin-Embedder-Policy");
        config.addExposedHeader("Cross-Origin-Opener-Policy");
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source) {
            @Override
            protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request, 
                                          jakarta.servlet.http.HttpServletResponse response, 
                                          jakarta.servlet.FilterChain filterChain)
                    throws java.io.IOException, jakarta.servlet.ServletException {
                // 设置跨源隔离头
                response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                super.doFilterInternal(request, response, filterChain);
            }
        };
    }
}