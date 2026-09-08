package com.peakfit.backend.auth;

import jakarta.validation.constraints.NotBlank;

// 프론트(Google Identity Services)가 구글에서 직접 받은 ID 토큰을 그대로 전달
public record GoogleLoginRequest(@NotBlank String idToken) {}
