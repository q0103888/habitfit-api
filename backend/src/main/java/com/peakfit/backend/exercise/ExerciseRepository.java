package com.peakfit.backend.exercise;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    // AI 루틴 생성 시 실제로 필요한 부위만 추려서 Claude에게 넘길 때 씀 (전체 460개를 다 줄 필요 없음)
    List<Exercise> findByBodyPartIn(List<String> bodyParts);
}
