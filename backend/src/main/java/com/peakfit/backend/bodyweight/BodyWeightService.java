package com.peakfit.backend.bodyweight;

import com.peakfit.backend.user.User;
import com.peakfit.backend.user.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

@Service
public class BodyWeightService {

    private final BodyWeightLogRepository logRepository;
    private final UserRepository userRepository;

    public BodyWeightService(BodyWeightLogRepository logRepository, UserRepository userRepository) {
        this.logRepository = logRepository;
        this.userRepository = userRepository;
    }

    // 전체 기록을 날짜 오름차순으로 조회 (최신값 = 마지막 항목)
    public List<BodyWeightResponse> list(String email) {
        User user = findUser(email);
        return logRepository.findByUserOrderByRecordedDateAsc(user).stream()
                .map(BodyWeightResponse::from)
                .toList();
    }

    // 오늘 이미 기록이 있으면 값만 덮어쓰고, 없으면 새로 만듦 (하루에 한 건만 유지)
    public BodyWeightResponse record(String email, BodyWeightRequest request) {
        User user = findUser(email);
        LocalDate today = LocalDate.now();
        BodyWeightLog log =
                logRepository
                        .findByUserAndRecordedDate(user, today)
                        .orElseGet(() -> new BodyWeightLog(user, today, request.weightKg()));
        log.setWeightKg(request.weightKg());
        return BodyWeightResponse.from(logRepository.save(log));
    }

    private User findUser(String email) {
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("사용자를 찾을 수 없습니다."));
    }
}
