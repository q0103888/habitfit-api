package com.peakfit.backend.security;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// @Configuration: "이 클래스는 스프링 설정 정보를 담고 있다"는 표시
// @EnableWebSecurity: 스프링 시큐리티 기능을 이 프로젝트에서 켬
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // 비밀번호 암호화 도구를 스프링 빈으로 등록.
    // 이걸 등록해두면 다른 클래스(AuthService)에서 생성자로 주입받아 바로 쓸 수 있음
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 이 프로젝트의 "인증/인가 규칙표" 전체를 정의하는 핵심 메서드
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CSRF: 브라우저 쿠키/세션 기반 로그인에서나 필요한 방어 기능.
                // 우리는 JWT를 쓰니까 해당 없음 → 꺼둠
                .csrf(csrf -> csrf.disable())

                // 방금 만든 CORS 설정을 적용
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 세션을 아예 안 만듦 (STATELESS) — JWT 방식이니 서버가 로그인 상태를 기억할 필요 없음
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(
                        auth ->
                                // 회원가입/로그인/헬스체크는 토큰 없이도 허용
                                auth.requestMatchers(
                                                "/api/auth/signup",
                                                "/api/auth/login",
                                                "/actuator/health",
                                                "/error") // 존재하지 않는 URL 요청 시 내부 포워딩되는 경로. 없으면 404가 403으로 둔갑함
                                        .permitAll()
                                        // 그 외 모든 요청은 인증(로그인) 필수
                                        .anyRequest()
                                        .authenticated())

                // 5단계에서 만든 필터를, 스프링이 기본 제공하는 인증 필터보다 "먼저" 실행되게 끼워 넣음
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 어떤 출처(도메인/포트)의 요청을 허용할지 정의.
    // 프론트(localhost:3100)와 백엔드(localhost:8080)는 포트가 달라서
    // 브라우저가 기본적으로 요청을 막는데, 이걸로 명시적으로 허용해줌
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3100"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}