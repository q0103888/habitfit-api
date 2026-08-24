package com.peakfit.backend.routine;

import com.peakfit.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "workout_routines")
@Getter
@Setter
@NoArgsConstructor
public class WorkoutRoutine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // DB에 루틴 테이블을 추가함
    // @ManyToOne: "여러 개의 루틴(Many)이 한 명의 User(One)에 속한다"는 관계.
    // User.java 때는 필드가 전부 String/LocalDate 같은 단순 값이었는데,
    // 이번엔 다른 엔티티(User) 자체를 필드로 가짐 — 이게 DB의 "외래키(FK)" 관계를 자바 코드로 표현하는 방식
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) // 실제 DB 컬럼명은 user_id
    private User user;

    @Column(name = "body_part", nullable = false)
    private String bodyPart; // "가슴", "등", "팔", "다리", "어깨" 중 하나

    @Column(name = "exercise_name", nullable = false)
    private String exerciseName; // 예: "플랫 벤치 프레스"

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate; // 이 루틴을 하기로 한 날짜

    @Column(nullable = false)
    private boolean done = false; // 완료 여부, 기본값은 false(미완료)

    // 반복 템플릿에서 자동 생성됐으면 그 템플릿 id, 수동으로 추가한 루틴이면 null
    @Column(name = "template_id")
    private Long templateId;

    public WorkoutRoutine(User user, String bodyPart, String exerciseName, LocalDate scheduledDate) {
        this.user = user;
        this.bodyPart = bodyPart;
        this.exerciseName = exerciseName;
        this.scheduledDate = scheduledDate;
    }
}