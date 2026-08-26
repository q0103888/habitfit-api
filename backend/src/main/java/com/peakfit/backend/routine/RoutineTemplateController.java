package com.peakfit.backend.routine;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// "매주 O요일 = 이 운동" 반복 규칙을 등록/조회/삭제하는 API.
// 여기서 만든 규칙 자체는 화면에 바로 안 보이고, RoutineController의 /week 조회 시점에
// 그 주에 아직 없는 요일만 실제 루틴으로 자동 생성(materialize)됨
@RestController
@RequestMapping("/api/routine-templates")
public class RoutineTemplateController {

    private final RoutineTemplateService templateService;

    public RoutineTemplateController(RoutineTemplateService templateService) {
        this.templateService = templateService;
    }

    // 내가 등록해둔 반복 규칙 전부 조회
    @GetMapping
    public ResponseEntity<List<RoutineTemplateResponse>> list(Principal principal) {
        return ResponseEntity.ok(templateService.list(principal.getName()));
    }

    // 새 반복 규칙 등록 ("매주 O요일 = 이 부위/운동")
    @PostMapping
    public ResponseEntity<RoutineTemplateResponse> create(
            Principal principal, @Valid @RequestBody RoutineTemplateRequest request) {
        return ResponseEntity.ok(templateService.create(principal.getName(), request));
    }

    // 반복 규칙 삭제 — 오늘 이후 이미 생성된 인스턴스도 같이 정리됨(RoutineTemplateService 참고)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
        templateService.delete(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
