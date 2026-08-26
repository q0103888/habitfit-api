package com.peakfit.backend.routine;

import com.peakfit.backend.user.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineTemplateRepository extends JpaRepository<RoutineTemplate, Long> {

    // 이 유저가 등록해둔 반복 규칙 전부 조회 — materializeTemplates()가 매주 이 목록을 훑음
    List<RoutineTemplate> findByUser(User user);
}
