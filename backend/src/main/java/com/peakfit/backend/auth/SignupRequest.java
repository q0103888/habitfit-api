package com.peakfit.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record SignupRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.") String password,
        @NotBlank String lastName,
        @NotBlank String firstName,
        @NotNull @Past(message = "생년월일은 과거 날짜여야 합니다.") LocalDate birthDate,
        @NotBlank String nationality) {}
