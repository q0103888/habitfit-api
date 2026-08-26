package com.peakfit.backend.routine;

import com.peakfit.backend.user.User;
import com.peakfit.backend.user.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 반복 루틴 규칙(RoutineTemplate)의 CRUD만 담당. 실제 요일별 루틴 자동 생성 로직은
// RoutineService.materializeTemplates()에 있음 — 이 서비스는 규칙 자체만 다룸
@Service
public class RoutineTemplateService {

    private final RoutineTemplateRepository templateRepository;
    private final WorkoutRoutineRepository routineRepository;
    private final UserRepository userRepository;

    public RoutineTemplateService(
            RoutineTemplateRepository templateRepository,
            WorkoutRoutineRepository routineRepository,
            UserRepository userRepository) {
        this.templateRepository = templateRepository;
        this.routineRepository = routineRepository;
        this.userRepository = userRepository;
    }

    // 이 유저가 등록해둔 반복 규칙 전부 조회
    public List<RoutineTemplateResponse> list(String email) {
        User user = findUser(email);
        return templateRepository.findByUser(user).stream().map(RoutineTemplateResponse::from).toList();
    }

    // 새 반복 규칙 저장 — 아직 실제 루틴을 만들진 않고, 다음 /week 조회 때 자동 생성됨
    public RoutineTemplateResponse create(String email, RoutineTemplateRequest request) {
        User user = findUser(email);
        RoutineTemplate template =
                new RoutineTemplate(user, request.bodyPart(), request.exerciseName(), request.dayOfWeek());
        return RoutineTemplateResponse.from(templateRepository.save(template));
    }

    @Transactional
    public void delete(String email, Long templateId) {
        User user = findUser(email);
        RoutineTemplate template =
                templateRepository
                        .findById(templateId)
                        .orElseThrow(() -> new IllegalArgumentException("템플릿을 찾을 수 없습니다."));

        if (!template.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("본인의 템플릿만 삭제할 수 있습니다.");
        }
        // 오늘 이후 이미 생성된 인스턴스는 같이 지움 — 지난 기록(과거 완료 여부 등)은 그대로 둠
        routineRepository.deleteByTemplateIdAndScheduledDateGreaterThanEqual(templateId, LocalDate.now());
        templateRepository.delete(template);
    }

    private User findUser(String email) {
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("사용자를 찾을 수 없습니다."));
    }
}
