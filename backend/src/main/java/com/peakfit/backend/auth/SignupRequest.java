package com.peakfit.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;


// 회원가입 API로 들어오는 요청 body의 모양을 정의.
// record는 "값만 담는 상자" 문법 — 생성자/getter가 자동 생김, 필드는 불변(final)
public record SignupRequest(
        // @NotBlank: null도 안 되고 빈 문자열("")도 안 됨
        // @Email: "xxx@xxx.xxx" 형식이어야 함
        @NotBlank @Email String email,

        // 8자 이상 강제. 조건 위반 시 message에 적은 문구가 에러 응답에 그대로 실림
        @NotBlank @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.") String password,

        @NotBlank String lastName,
        @NotBlank String firstName,

        // @Past: 반드시 "오늘보다 과거" 날짜여야 함 (미래 생년월일 입력 방지)
        @NotNull @Past(message = "생년월일은 과거 날짜여야 합니다.") LocalDate birthDate,

        @NotBlank String nationality) {}