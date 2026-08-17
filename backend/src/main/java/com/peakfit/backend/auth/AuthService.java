package com.peakfit.backend.auth;

import com.peakfit.backend.security.JwtService;
import com.peakfit.backend.user.User;
import com.peakfit.backend.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// @Service: "이 클래스는 비즈니스 로직을 담당한다"는 스프링 표시.
// @Component/@Repository 등과 동작은 같지만, 역할이 뭔지 이름으로 구분하기 위해 씀
@Service
public class AuthService {

    // 아래 3개는 전부 이전 단계에서 만든 부품들.
    // 여기서 직접 new로 만들지 않고, 스프링이 미리 만들어둔 걸 주입받아서 씀 (생성자 주입)
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;   // 6단계 SecurityConfig에서 @Bean으로 등록해둔 것
    private final JwtService jwtService;             // 4단계에서 만든 도장 기계/검사기

    public AuthService(
            UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // 회원가입
    public AuthResponse signup(SignupRequest request) {
        // 이메일 중복 체크 — 2단계에서 만든 existsByEmail 사용
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        // 1단계에서 만든 생성자로 새 User 객체 조립.
        // 비밀번호는 원본 그대로가 아니라 passwordEncoder.encode()로 암호화해서 저장
        User user =
                new User(
                        request.email(),
                        passwordEncoder.encode(request.password()),
                        request.lastName(),
                        request.firstName(),
                        request.birthDate(),
                        request.nationality());

        // id가 없는 새 객체 → save()가 INSERT 실행
        userRepository.save(user);

        // 가입 완료 = 로그인도 된 것으로 취급 → 바로 토큰 발급해서 반환
        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail());
    }

    // 로그인
    public AuthResponse login(LoginRequest request) {
        // 이메일로 DB 조회. 없으면 예외 던짐 (findByEmail은 2단계에서 만듦)
        User user =
                userRepository
                        .findByEmail(request.email())
                        .orElseThrow(
                                () -> new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다."));

        // 입력한 비밀번호를 같은 방식으로 암호화해서, 저장된 해시값과 일치하는지 비교
        // (DB에 저장된 원본 비밀번호가 없으니, 쿼리로 비교하는 게 아니라 여기서 코드로 비교)
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        // 통과했으면 signup과 동일하게 토큰 발급
        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail());
    }
}