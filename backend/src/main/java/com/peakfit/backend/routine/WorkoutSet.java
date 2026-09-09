package com.peakfit.backend.routine;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 루틴 1건에 딸린 세트 기록 (예: "체스트프레스 1세트 = 60kg x 10회", 유산소는 "러닝 = 30분").
// weightKg/reps와 durationMin은 서로 배타적 — 유산소면 durationMin만, 그 외엔 weightKg/reps만 채워짐.
// routineId는 WorkoutRoutine을 가리키는 단순 참조값 — templateId와 같은 방식으로 FK 제약은 안 걸어둠
@Entity
@Table(name = "workout_sets")
@Getter
@NoArgsConstructor
public class WorkoutSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "routine_id", nullable = false)
    private Long routineId;

    @Column(name = "set_number", nullable = false)
    private int setNumber; // 몇 번째 세트인지 (1부터 시작)

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column
    private Integer reps;

    @Column(name = "duration_min")
    private Integer durationMin; // 유산소 운동일 때만 값이 들어감 (분 단위)

    public WorkoutSet(Long routineId, int setNumber, Double weightKg, Integer reps, Integer durationMin) {
        this.routineId = routineId;
        this.setNumber = setNumber;
        this.weightKg = weightKg;
        this.reps = reps;
        this.durationMin = durationMin;
    }
}
