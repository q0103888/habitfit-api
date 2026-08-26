package com.peakfit.backend.exercise;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 부위별 운동 카탈로그 조회 API. 루틴 추가 화면에서 자유 입력 대신 여기서 골라 쓰게 하기 위한 참조 데이터라
// 조회(GET)만 있고 생성/수정/삭제는 없음 — 목록은 ExerciseSeeder가 앱 시작 시 미리 채워둠
@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    private final ExerciseRepository exerciseRepository;

    public ExerciseController(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    // 전체를 한 번에 내려주고, 부위별 필터링은 프론트에서 함 (개수가 적어서 왕복 아낄 수 있음)
    @GetMapping
    public ResponseEntity<List<ExerciseResponse>> list() {
        return ResponseEntity.ok(exerciseRepository.findAll().stream().map(ExerciseResponse::from).toList());
    }
}
