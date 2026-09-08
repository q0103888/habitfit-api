package com.peakfit.backend.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.peakfit.backend.security.JwtService;
import com.peakfit.backend.user.User;
import com.peakfit.backend.user.UserRepository;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Value;
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
    private final GoogleIdTokenVerifier googleVerifier;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.google.client-id}") String googleClientId) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleVerifier =
                new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                        .setAudience(Collections.singletonList(googleClientId))
                        .build();
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
        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail(), user.getFirstName());
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
        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail(), user.getFirstName());
    }

    // 구글 로그인 — 프론트(Google Identity Services)가 이미 구글 계정 확인을 끝내고 넘겨준
    // ID 토큰의 서명/유효기간/대상(audience)을 여기서 검증. 통과하면 그 자체가 "본인 확인 완료"라는 뜻
    public AuthResponse loginWithGoogle(String idTokenString) {
        GoogleIdToken idToken;
        try {
            idToken = googleVerifier.verify(idTokenString);
        } catch (GeneralSecurityException | IOException e) {
            throw new BadCredentialsException("구글 로그인 검증에 실패했습니다.");
        }
        if (idToken == null) {
            throw new BadCredentialsException("유효하지 않은 구글 토큰입니다.");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        // 구글 계정에 아직 인증 안 된 이메일(예: 등록만 하고 확인 메일 클릭 안 한 부계정)을
        // 그대로 믿으면, 그 이메일의 진짜 주인 행세를 할 수 있는 계정 탈취 경로가 생김
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new BadCredentialsException("인증되지 않은 구글 이메일입니다.");
        }
        String email = payload.getEmail();
        String firstName = (String) payload.get("given_name");
        String lastName = (String) payload.get("family_name");

        // 이미 이메일/비밀번호로 가입했던 사람이 구글로도 로그인하면 그냥 같은 계정으로 이어줌.
        // 구글이 이미 이 이메일의 주인임을 검증해준 상태라 별도 비밀번호 확인은 필요 없음
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseGet(
                                () -> {
                                    User newUser = new User();
                                    newUser.setEmail(email);
                                    newUser.setFirstName(firstName != null ? firstName : "");
                                    newUser.setLastName(lastName != null ? lastName : "");
                                    newUser.setProvider("google");
                                    return userRepository.save(newUser);
                                });

        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail(), user.getFirstName());
    }
}