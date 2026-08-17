package com.peakfit.backend.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

// DB 조회를 담당하는 계층. 몸통(구현체)이 없는 인터페이스인데도 동작함 —
// Spring Data JPA가 부팅 시점에 메서드 이름을 분석해서 실제 구현체를 자동으로 만들어줌.
public interface UserRepository extends JpaRepository<User, Long> {
    // JpaRepository<User, Long>을 상속만 해도
    // save(), findById(), findAll(), deleteById() 같은 기본 CRUD 메서드가 전부 공짜로 딸려옴

    // 메서드 이름 "findByEmail"을 분석해서 자동으로 이런 SQL을 만들어 실행함:
    // SELECT * FROM users WHERE email = ?
    // 결과가 없을 수도 있어서 User가 아니라 Optional<User>로 감싸서 반환
    Optional<User> findByEmail(String email);

    // "existsByEmail"도 이름 분석 대상 —
    // SELECT EXISTS(SELECT 1 FROM users WHERE email = ?) 같은 존재 여부만 확인하는 쿼리로 변환됨
    // (회원가입 시 이메일 중복 체크에 사용할 예정)
    boolean existsByEmail(String email);
}