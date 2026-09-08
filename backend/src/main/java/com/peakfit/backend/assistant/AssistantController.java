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

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    // 로그인한 사용자만 호출 가능(SecurityConfig의 anyRequest().authenticated()에 자동으로 걸림)
    @PostMapping("/ask")
    public AskResponse ask(Principal principal, @Valid @RequestBody AskRequest request) {
        return new AskResponse(assistantService.ask(principal.getName(), request.question(), request.history()));
    }
}
