package com.peakfit.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// JWT(로그인 증명서) 발급/검증만 전담하는 클래스.
// @Component: 스프링이 앱 시작할 때 이 클래스의 객체를 하나 만들어서
// 다른 클래스(JwtAuthFilter, AuthService)가 주입받아 쓸 수 있게 등록함
@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    // @Value: application.properties의 app.jwt.secret / app.jwt.expiration-ms 값을
    // 생성자 파라미터로 그대로 주입받음 (하드코딩 대신 설정 파일에서 읽어옴)
    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        // 문자열 비밀키를 JWT 서명에 쓸 수 있는 SecretKey 객체로 변환
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // 로그인/회원가입 성공 시 호출 — email을 넣으면 서명된 토큰 문자열을 반환
    public String generateToken(String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(email)                                       // "이 토큰은 누구 것인가"
                .issuedAt(Date.from(now))                              // 발급 시각
                .expiration(Date.from(now.plusMillis(expirationMs)))   // 만료 시각 (지금 설정은 24시간)
                .signWith(key)                                          // 비밀키로 서명 (위조 방지)
                .compact();                                              // 최종 문자열로 압축
    }

    // 유효한 토큰에서 "누구였는지"(email)만 꺼냄
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    // 토큰이 위조되지 않았고 아직 만료 전인지 확인
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // 서명이 안 맞거나(위조), 만료됐거나, 형식이 깨졌으면 여기로 옴
            return false;
        }
    }

    // 토큰 문자열을 비밀키로 검증하면서 동시에 내용물(Claims)을 꺼내는 공통 로직
    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}