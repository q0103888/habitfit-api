package com.peakfit.backend.routine;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutSetRepository extends JpaRepository<WorkoutSet, Long> {

    // 여러 루틴의 세트를 한 번에 조회 (N+1 방지) — 루틴 목록 응답 만들 때 씀
    List<WorkoutSet> findByRoutineIdInOrderByRoutineIdAscSetNumberAsc(List<Long> routineIds);

    // 다음 세트 번호를 정하기 위해 현재 몇 세트까지 있는지 조회
    long countByRoutineId(Long routineId);

    // 루틴 삭제 시 딸려있던 세트도 같이 정리
    void deleteByRoutineId(Long routineId);
}
