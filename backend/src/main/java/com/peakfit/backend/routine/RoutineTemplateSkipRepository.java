package com.peakfit.backend.routine;

import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineTemplateSkipRepository extends JpaRepository<RoutineTemplateSkip, Long> {

    boolean existsByTemplateIdAndSkippedDate(Long templateId, LocalDate skippedDate);
}
