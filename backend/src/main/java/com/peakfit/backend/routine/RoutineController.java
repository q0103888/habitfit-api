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

    @GetMapping
    public ResponseEntity<List<RoutineResponse>> list(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(routineService.list(principal.getName(), date));
    }

    @GetMapping("/week")
    public ResponseEntity<List<RoutineResponse>> listWeek(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(routineService.listWeek(principal.getName(), date));
    }

    @PostMapping
    public ResponseEntity<RoutineResponse> create(
            Principal principal, @Valid @RequestBody RoutineRequest request) {
        return ResponseEntity.ok(routineService.create(principal.getName(), request));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<RoutineResponse> toggleDone(Principal principal, @PathVariable Long id) {
        return ResponseEntity.ok(routineService.toggleDone(principal.getName(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
        routineService.delete(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
