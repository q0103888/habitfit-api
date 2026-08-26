package com.peakfit.backend.routine;

import com.peakfit.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.DayOfWeek;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// "매주 월요일 = 가슴 운동" 같은 반복 규칙. 특정 날짜가 아니라 요일을 가짐.
// listWeek() 조회 시점에 이 규칙을 보고 그 주의 실제 WorkoutRoutine을 자동으로 만들어줌
@Entity
@Table(name = "routine_templates")
@Getter
@Setter
@NoArgsConstructor
public class RoutineTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "body_part", nullable = false)
    private String bodyPart; // 영어 코드로 저장 (CHEST/BACK/SHOULDER/LEG/ARM_ABS), WorkoutRoutine과 동일 규칙

    @Column(name = "exercise_name", nullable = false)
    private String exerciseName;

    // EnumType.STRING: DB엔 "MONDAY" 같은 문자열로 저장 (숫자 ordinal로 저장하면 enum 순서
    // 바뀔 때 기존 데이터가 엉뚱한 요일을 가리키게 될 수 있어서 이 방식이 더 안전함)
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    public RoutineTemplate(User user, String bodyPart, String exerciseName, DayOfWeek dayOfWeek) {
        this.user = user;
        this.bodyPart = bodyPart;
        this.exerciseName = exerciseName;
        this.dayOfWeek = dayOfWeek;
    }
}
