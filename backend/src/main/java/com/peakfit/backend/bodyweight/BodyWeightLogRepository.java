package com.peakfit.backend.bodyweight;

import com.peakfit.backend.user.User;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BodyWeightLogRepository extends JpaRepository<BodyWeightLog, Long> {

    // 시간 순으로 전체 기록 조회 — 나중에 통계 그래프에서 그대로 씀
    List<BodyWeightLog> findByUserOrderByRecordedDateAsc(User user);

    // 오늘 이미 기록했는지 확인 (있으면 새로 만들지 않고 덮어씀)
    Optional<BodyWeightLog> findByUserAndRecordedDate(User user, LocalDate recordedDate);
}
