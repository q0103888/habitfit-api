package com.peakfit.backend.common;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// @RestControllerAdvice: 이 프로젝트의 "모든" @RestController에서 예외가 발생하면
// 여기로 자동으로 모아서 처리해줌 (컨트롤러마다 try-catch 반복 안 해도 됨)
@RestControllerAdvice
public class ApiExceptionHandler {

    // AuthService.signup()에서 던진 IllegalArgumentException(이메일 중복)을 여기서 낚아챔
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        // 400 Bad Request + { "message": "이미 가입된 이메일입니다." } 형태로 응답
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    // AuthService.login()에서 던진 BadCredentialsException(로그인 실패)을 낚아챔
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorized(BadCredentialsException e) {
        // 401 Unauthorized + 에러 메시지
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
    }

    // AuthController의 @Valid 검증(3단계 @NotBlank, @Email, @Past 등)이 실패하면
    // 스프링이 자동으로 이 예외를 던짐 — 그걸 여기서 낚아챔
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        // 여러 필드가 동시에 검증 실패할 수도 있어서, 그중 첫 번째 에러 메시지만 꺼내서 보여줌
        String message =
                e.getBindingResult().getFieldErrors().stream()
                        .findFirst()
                        .map(f -> f.getDefaultMessage())
                        .orElse("잘못된 요청입니다.");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}