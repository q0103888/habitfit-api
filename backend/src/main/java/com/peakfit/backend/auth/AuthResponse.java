package com.peakfit.backend.auth;

// 회원가입/로그인 성공 시 돌려줄 응답 모양.
// User 엔티티를 그대로 안 돌려주는 이유: User 안엔 passwordHash 같은
// 민감 정보가 있어서, API 응답용으로는 필요한 값만 골라 담은 별도 상자를 씀
public record AuthResponse(String token, String email) {}