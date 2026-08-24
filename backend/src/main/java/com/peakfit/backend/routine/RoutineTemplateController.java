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

@RestController
@RequestMapping("/api/routine-templates")
public class RoutineTemplateController {

    private final RoutineTemplateService templateService;

    public RoutineTemplateController(RoutineTemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public ResponseEntity<List<RoutineTemplateResponse>> list(Principal principal) {
        return ResponseEntity.ok(templateService.list(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<RoutineTemplateResponse> create(
            Principal principal, @Valid @RequestBody RoutineTemplateRequest request) {
        return ResponseEntity.ok(templateService.create(principal.getName(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
        templateService.delete(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
