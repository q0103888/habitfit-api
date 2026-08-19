package com.peakfit.backend.security;

import com.peakfit.backend.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

// OncePerRequestFilter를 상속하면, 이 서버로 들어오는 "모든" HTTP 요청마다
// doFilterInternal()이 자동으로 한 번씩 실행됨 (요청마다 문지기가 검문하는 셈)
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // 요청 헤더에서 "Authorization: Bearer eyJ..." 형태의 값을 꺼냄
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            // "Bearer " 뒤(7글자 이후)가 진짜 토큰 문자열
            String token = header.substring(7);

            if (jwtService.isValid(token)) {
                String email = jwtService.extractEmail(token);

                // 토큰이 진짜면, 이메일로 실제 유저가 DB에 있는지 확인
                userRepository
                        .findByEmail(email)
                        .ifPresent(
                                user -> {
                                    // "이 요청은 이 사람이 보낸 게 맞다"고 스프링 시큐리티에 등록.
                                    // Spring Security 6부터는 기존 context를 그대로 수정하는 대신
                                    // 새 context를 만들어서 통째로 SecurityContextHolder에 등록해야
                                    // 뒤쪽 필터(AuthorizationFilter)에서 확실히 인식됨
                                    var auth =
                                            new UsernamePasswordAuthenticationToken(
                                                    user.getEmail(), null, List.of());
                                    SecurityContext context = SecurityContextHolder.createEmptyContext();
                                    context.setAuthentication(auth);
                                    SecurityContextHolder.setContext(context);
                                });
            }
        }

        // 검문 끝났으면 다음 처리 단계로 넘김.
        // 이 줄이 없으면 모든 요청이 여기서 영원히 멈춰버림 (필수!)
        filterChain.doFilter(request, response);
    }
}
