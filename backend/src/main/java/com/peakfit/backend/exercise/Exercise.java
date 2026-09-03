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
    private String name; // 내부 식별 키로 쓰는 한글 이름 (예: "벤치프레스") — 루틴/템플릿/통계가 전부 이 값으로 매칭하므로 불변

    @Column(name = "name_ja")
    private String nameJa; // 화면 표시용 일본어 번역. 없으면 컨트롤러에서 name으로 폴백

    @Column(name = "image_url", length = 500)
    private String imageUrl; // 자세 참고용 이미지 — free-exercise-db(퍼블릭 도메인) CDN URL

    public Exercise(String bodyPart, String name, String nameJa) {
        this.bodyPart = bodyPart;
        this.name = name;
        this.nameJa = nameJa;
    }

    public void setNameJa(String nameJa) {
        this.nameJa = nameJa;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
