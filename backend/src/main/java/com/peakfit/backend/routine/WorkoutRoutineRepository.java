package com.peakfit.backend.routine;

import com.peakfit.backend.user.User;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutRoutineRepository extends JpaRepository<WorkoutRoutine, Long> {

    // "특정 사용자의, 특정 날짜 루틴 전부 조회" — 조건이 2개라 필드명 두 개를
    // And로 이어붙임. Spring Data JPA가 메서드 이름을 분석해서
    // SELECT * FROM workout_routines WHERE user_id = ? AND scheduled_date = ?
    // 를 자동으로 만들어줌
    List<WorkoutRoutine> findByUserAndScheduledDate(User user, LocalDate scheduledDate);

    // 이번 주 운동 기록 그래프/달성률 계산용 — 날짜 범위로 조회
    List<WorkoutRoutine> findByUserAndScheduledDateBetween(User user, LocalDate start, LocalDate end);

    // 템플릿 삭제 시, 그 템플릿에서 나온 오늘/이후 루틴도 같이 정리 (지난 기록은 그대로 둠)
    void deleteByTemplateIdAndScheduledDateGreaterThanEqual(Long templateId, LocalDate date);
}