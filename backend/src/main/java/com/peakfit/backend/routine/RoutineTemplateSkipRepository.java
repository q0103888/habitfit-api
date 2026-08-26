package com.peakfit.backend.routine;

import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineTemplateSkipRepository extends JpaRepository<RoutineTemplateSkip, Long> {

    // 이 템플릿이 그 날짜에 스킵 처리됐는지 확인 — true면 materializeTemplates()가 다시 안 만듦
    boolean existsByTemplateIdAndSkippedDate(Long templateId, LocalDate skippedDate);
}
