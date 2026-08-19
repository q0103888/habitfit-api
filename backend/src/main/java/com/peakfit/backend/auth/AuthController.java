package com.peakfit.backend.auth;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// @RestController: 이 클래스의 메서드가 반환하는 값을 자동으로 JSON으로 변환해서 응답함
// @RequestMapping("/api/auth"): 이 클래스 안의 모든 URL 앞에 공통으로 /api/auth가 붙음
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST http://localhost:8080/api/auth/signup 로 요청 오면 이 메서드 실행
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        // @RequestBody: 요청의 JSON body를 자동으로 SignupRequest 객체로 변환
        // @Valid: 3단계에서 SignupRequest에 붙여둔 @NotBlank, @Email, @Past 검증을
        //         여기서 실제로 실행시킴 (조건 위반 시 여기서 바로 예외 발생, signup()까지 안 감)
        return ResponseEntity.ok(authService.signup(request));
    }

    // POST http://localhost:8080/api/auth/login 로 요청 오면 이 메서드 실행
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}