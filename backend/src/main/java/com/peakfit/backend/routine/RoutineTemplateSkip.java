package com.peakfit.backend.routine;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;

// "이 템플릿은 이 날짜만큼은 자동 생성하지 마라"는 기록.
// 사용자가 템플릿에서 나온 루틴을 그날만 삭제(스킵)했을 때 남겨서, 다음 조회 때 또 만들어지는 걸 막음
@Entity
@Table(name = "routine_template_skips")
@Getter
@NoArgsConstructor
public class RoutineTemplateSkip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "skipped_date", nullable = false)
    private LocalDate skippedDate;

    public RoutineTemplateSkip(Long templateId, LocalDate skippedDate) {
        this.templateId = templateId;
        this.skippedDate = skippedDate;
    }
}
