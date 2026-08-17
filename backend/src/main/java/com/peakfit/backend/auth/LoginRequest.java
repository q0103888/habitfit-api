package com.peakfit.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// 로그인은 이메일/비밀번호만 필요하니까 SignupRequest보다 훨씬 단순
public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}