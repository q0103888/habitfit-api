package com.peakfit.backend.auth;

import com.peakfit.backend.security.JwtService;
import com.peakfit.backend.user.User;
import com.peakfit.backend.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        User user =
                new User(
                        request.email(),
                        passwordEncoder.encode(request.password()),
                        request.lastName(),
                        request.firstName(),
                        request.birthDate(),
                        request.nationality());
        userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        User user =
                userRepository
                        .findByEmail(request.email())
                        .orElseThrow(
                                () -> new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail());
    }

    public MeResponse getProfile(String email) {
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() -> new BadCredentialsException("사용자를 찾을 수 없습니다."));
        return new MeResponse(
                user.getEmail(),
                user.getLastName(),
                user.getFirstName(),
                user.getBirthDate(),
                user.getNationality());
    }
}
