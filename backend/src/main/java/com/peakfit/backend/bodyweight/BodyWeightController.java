package com.peakfit.backend.bodyweight;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 몸무게 기록 조회/등록 API. 하루 한 건만 유지되고(같은 날 다시 기록하면 덮어씀),
// 여러 날짜의 기록이 쌓이면 나중에 통계 화면에서 시간에 따른 변화 그래프로 씀
@RestController
@RequestMapping("/api/body-weight")
public class BodyWeightController {

    private final BodyWeightService bodyWeightService;

    public BodyWeightController(BodyWeightService bodyWeightService) {
        this.bodyWeightService = bodyWeightService;
    }

    // 전체 기록 조회 (날짜 오름차순)
    @GetMapping
    public ResponseEntity<List<BodyWeightResponse>> list(Principal principal) {
        return ResponseEntity.ok(bodyWeightService.list(principal.getName()));
    }

    // 오늘 몸무게 기록/수정
    @PostMapping
    public ResponseEntity<BodyWeightResponse> record(
            Principal principal, @Valid @RequestBody BodyWeightRequest request) {
        return ResponseEntity.ok(bodyWeightService.record(principal.getName(), request));
    }
}
