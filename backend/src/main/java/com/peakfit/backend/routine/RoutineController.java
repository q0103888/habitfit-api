package com.peakfit.backend.routine;

import jakarta.validation.Valid;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// JwtAuthFilter가 인증에 성공하면 principal에 로그인한 유저의 email이 들어있음.
// Principal을 파라미터로 받으면 스프링이 SecurityContext에서 자동으로 꺼내서 넣어줌
@RestController
@RequestMapping("/api/routines")
public class RoutineController {

    private final RoutineService routineService;

    public RoutineController(RoutineService routineService) {
        this.routineService = routineService;
    }

    // 특정 날짜(없으면 오늘) 루틴 목록 조회
    @GetMapping
    public ResponseEntity<List<RoutineResponse>> list(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(routineService.list(principal.getName(), date));
    }

    // date가 속한 주(월~일) 전체 조회 — 조회할 때마다 반복 템플릿을 자동으로 채워 넣음(materialize)
    @GetMapping("/week")
    public ResponseEntity<List<RoutineResponse>> listWeek(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(routineService.listWeek(principal.getName(), date));
    }

    // 연속 달성일 조회 — 계산 로직은 RoutineService.calculateStreak() 참고
    @GetMapping("/streak")
    public ResponseEntity<StreakResponse> streak(Principal principal) {
        return ResponseEntity.ok(new StreakResponse(routineService.calculateStreak(principal.getName())));
    }

    // 새 루틴 추가 (반복 템플릿과 무관한 1회성 루틴)
    @PostMapping
    public ResponseEntity<RoutineResponse> create(
            Principal principal, @Valid @RequestBody RoutineRequest request) {
        return ResponseEntity.ok(routineService.create(principal.getName(), request));
    }

    // 완료 체크 토글 (done true/false 뒤집기)
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<RoutineResponse> toggleDone(Principal principal, @PathVariable Long id) {
        return ResponseEntity.ok(routineService.toggleDone(principal.getName(), id));
    }

    // 루틴 삭제 — 템플릿에서 나온 루틴이면 그 날짜만 스킵 처리하고 지움
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
        routineService.delete(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

    // 세트 기록 추가 (몇 kg x 몇 회) — 갱신된 루틴(세트 목록 포함)을 그대로 응답
    @PostMapping("/{id}/sets")
    public ResponseEntity<RoutineResponse> addSet(
            Principal principal, @PathVariable Long id, @Valid @RequestBody WorkoutSetRequest request) {
        return ResponseEntity.ok(routineService.addSet(principal.getName(), id, request));
    }

    // 세트 기록 삭제
    @DeleteMapping("/{id}/sets/{setId}")
    public ResponseEntity<RoutineResponse> deleteSet(
            Principal principal, @PathVariable Long id, @PathVariable Long setId) {
        return ResponseEntity.ok(routineService.deleteSet(principal.getName(), id, setId));
    }

    // 특정 운동의 무게 추이 (통계 화면 그래프용)
    @GetMapping("/history")
    public ResponseEntity<List<ExerciseHistoryPoint>> exerciseHistory(
            Principal principal, @RequestParam String exerciseName) {
        return ResponseEntity.ok(routineService.exerciseHistory(principal.getName(), exerciseName));
    }

    // 최근 30일 부위별 운동 비중 (통계 화면 도넛차트용)
    @GetMapping("/summary")
    public ResponseEntity<List<BodyPartSummaryPoint>> bodyPartSummary(Principal principal) {
        return ResponseEntity.ok(routineService.bodyPartSummary(principal.getName()));
    }
}
