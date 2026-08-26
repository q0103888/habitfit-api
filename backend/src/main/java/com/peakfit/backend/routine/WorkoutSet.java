package com.peakfit.backend.routine;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 루틴 1건에 딸린 세트 기록 (예: "체스트프레스 1세트 = 60kg x 10회").
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

    @Column(name = "weight_kg", nullable = false)
    private double weightKg;

    @Column(nullable = false)
    private int reps;

    public WorkoutSet(Long routineId, int setNumber, double weightKg, int reps) {
        this.routineId = routineId;
        this.setNumber = setNumber;
        this.weightKg = weightKg;
        this.reps = reps;
    }
}
