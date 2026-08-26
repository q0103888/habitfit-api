package com.peakfit.backend.bodyweight;

import com.peakfit.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 유저별 하루 몸무게 기록. 같은 날짜에 또 기록하면 새로 만들지 않고 기존 값을 덮어씀
// (BodyWeightService.record() 참고) — 나중에 통계 화면에서 시간에 따른 변화 그래프에 씀
@Entity
@Table(name = "body_weight_logs")
@Getter
@Setter
@NoArgsConstructor
public class BodyWeightLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate;

    @Column(name = "weight_kg", nullable = false)
    private double weightKg;

    public BodyWeightLog(User user, LocalDate recordedDate, double weightKg) {
        this.user = user;
        this.recordedDate = recordedDate;
        this.weightKg = weightKg;
    }
}
