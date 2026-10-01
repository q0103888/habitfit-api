package com.peakfit.backend.assistant;

import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;
    private final RoutinePlanService routinePlanService;

    public AssistantController(AssistantService assistantService, RoutinePlanService routinePlanService) {
        this.assistantService = assistantService;
        this.routinePlanService = routinePlanService;
    }

    // 로그인한 사용자만 호출 가능(SecurityConfig의 anyRequest().authenticated()에 자동으로 걸림)
    @PostMapping("/ask")
    public AskResponse ask(Principal principal, @Valid @RequestBody AskRequest request) {
        return new AskResponse(assistantService.ask(principal.getName(), request.question(), request.history()));
    }

    // AI 루틴 자동 생성 — 결과는 바로 저장되지 않고 미리보기로만 반환됨(적용은 프론트가 기존 템플릿 API로 별도 호출)
    @PostMapping("/routine-plan")
    public RoutinePlanResponse generateRoutinePlan(
            Principal principal, @Valid @RequestBody RoutinePlanRequest request) {
        return routinePlanService.generate(principal.getName(), request);
    }
}
