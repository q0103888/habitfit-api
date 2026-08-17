package com.peakfit.backend.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// DB의 users 테이블과 1:1로 매칭되는 클래스.
// 필드를 추가/삭제하면 Hibernate가 실제 테이블 구조도 따라서 바꿔줌 (ddl-auto=update).
@Entity
@Table(name = "users")
@Getter // getEmail(), getFirstName() 같은 조회 메서드를 자동 생성
@Setter // setEmail(), setFirstName() 같은 값 변경 메서드를 자동 생성
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 로그인 아이디로 쓰는 이메일. unique = true로 DB가 중복 가입을 직접 막아줌
    @Column(nullable = false, unique = true)
    private String email;

    // 원본 비밀번호가 아니라 BCrypt로 암호화된 해시값을 저장 (AuthService 단계에서 사용)
    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false)
    private String nationality;

    // 로그인 방식 (local/google/kakao). 지금은 이메일 가입만 만들 거라 기본값 고정
    @Column(nullable = false)
    private String provider = "local";

    private String timezone = "Asia/Seoul";

    // 가입 시각. updatable = false라 한번 저장되면 이후 수정 쿼리에 절대 포함되지 않음
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // 회원가입 시 실제로 사용할 생성자.
    // id, createdAt 같은 자동/기본값 필드는 뺴고, 꼭 입력받아야 하는 값만 받음
    public User(
            String email,
            String passwordHash,
            String lastName,
            String firstName,
            LocalDate birthDate,
            String nationality) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.lastName = lastName;
        this.firstName = firstName;
        this.birthDate = birthDate;
        this.nationality = nationality;
    }
}
