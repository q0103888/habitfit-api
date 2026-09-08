package com.peakfit.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.peakfit.backend.security.JwtService;
import com.peakfit.backend.user.User;
import com.peakfit.backend.user.UserRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

// AuthService의 핵심 분기(이메일 중복, 비밀번호 검증)만 골라서 검증.
// RoutineServiceTest와 동일한 방식 — 리포지토리/암호화기는 전부 Mockito로 가짜 처리
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;

    private AuthService authService;
    private static final String EMAIL = "test@peakfit.app";

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService, "test-client-id");
    }

    private SignupRequest signupRequest() {
        return new SignupRequest(EMAIL, "password123", "성", "이름", LocalDate.of(2000, 1, 1), "KR");
    }

    // ---------- signup ----------

    @Test
    void signup_이미_가입된_이메일이면_거부한다() {
        when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(signupRequest()))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void signup_성공하면_비밀번호를_암호화해서_저장하고_토큰을_반환한다() {
        when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-hash");
        when(jwtService.generateToken(EMAIL)).thenReturn("fake-jwt");

        AuthResponse response = authService.signup(signupRequest());

        assertThat(response.token()).isEqualTo("fake-jwt");
        assertThat(response.email()).isEqualTo(EMAIL);
        // 원본 비밀번호가 아니라 암호화된 값으로 저장됐는지 확인
        verify(userRepository, times(1)).save(argThat(u -> "encoded-hash".equals(u.getPasswordHash())));
    }

    // ---------- login ----------

    @Test
    void login_존재하지_않는_이메일이면_거부한다() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, "password123")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_비밀번호가_틀리면_거부한다() {
        User user = new User(EMAIL, "stored-hash", "성", "이름", LocalDate.of(2000, 1, 1), "KR");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "stored-hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, "wrong-password")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_성공하면_토큰을_반환한다() {
        User user = new User(EMAIL, "stored-hash", "성", "이름", LocalDate.of(2000, 1, 1), "KR");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "stored-hash")).thenReturn(true);
        when(jwtService.generateToken(EMAIL)).thenReturn("fake-jwt");

        AuthResponse response = authService.login(new LoginRequest(EMAIL, "password123"));

        assertThat(response.token()).isEqualTo("fake-jwt");
        assertThat(response.firstName()).isEqualTo("이름");
    }
}
