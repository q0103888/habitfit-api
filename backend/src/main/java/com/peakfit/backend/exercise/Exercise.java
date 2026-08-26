package com.peakfit.backend.exercise;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 부위별 운동 종목 카탈로그. 유저 소유가 아니라 전체가 공유하는 참조 데이터.
// 루틴을 만들 때 여기서 골라 쓰지만, WorkoutRoutine.exerciseName은 여전히 그냥 문자열로 저장됨
@Entity
@Table(name = "exercises")
@Getter
@NoArgsConstructor
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "body_part", nullable = false)
    private String bodyPart; // WorkoutRoutine/RoutineTemplate과 같은 영어 코드 규칙 (CHEST, BACK ...)

    @Column(nullable = false)
    private String name; // 화면에 그대로 보여주는 한글 운동 이름 (예: "벤치프레스")

    public Exercise(String bodyPart, String name) {
        this.bodyPart = bodyPart;
        this.name = name;
    }
}
