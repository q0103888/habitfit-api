package com.peakfit.backend.routine;

import com.peakfit.backend.user.User;
import com.peakfit.backend.user.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

@Service
public class RoutineService {

    private final WorkoutRoutineRepository routineRepository;
    private final RoutineTemplateRepository templateRepository;
    private final RoutineTemplateSkipRepository skipRepository;
    private final UserRepository userRepository;

    public RoutineService(
            WorkoutRoutineRepository routineRepository,
            RoutineTemplateRepository templateRepository,
            RoutineTemplateSkipRepository skipRepository,
            UserRepository userRepository) {
        this.routineRepository = routineRepository;
        this.templateRepository = templateRepository;
        this.skipRepository = skipRepository;
        this.userRepository = userRepository;
    }

    // date가 없으면 오늘 날짜 기준으로 조회
    public List<RoutineResponse> list(String email, LocalDate date) {
        User user = findUser(email);
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return routineRepository.findByUserAndScheduledDate(user, targetDate).stream()
                .map(RoutineResponse::from)
                .toList();
    }

    // anchor가 속한 주(월요일~일요일) 전체 루틴 조회 — 주간 기록 그래프/달성률 계산용.
    // 반복 템플릿이 있으면, 이번 주에 아직 실제로 만들어지지 않은 요일만 채워 넣음
    public List<RoutineResponse> listWeek(String email, LocalDate anchor) {
        User user = findUser(email);
        LocalDate reference = anchor != null ? anchor : LocalDate.now();
        LocalDate weekStart = reference.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = reference.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        materializeTemplates(user, weekStart);

        return routineRepository.findByUserAndScheduledDateBetween(user, weekStart, weekEnd).stream()
                .map(RoutineResponse::from)
                .toList();
    }

    private void materializeTemplates(User user, LocalDate weekStart) {
        List<RoutineTemplate> templates = templateRepository.findByUser(user);
        if (templates.isEmpty()) return;

        LocalDate weekEnd = weekStart.plusDays(6);
        List<WorkoutRoutine> existing = routineRepository.findByUserAndScheduledDateBetween(user, weekStart, weekEnd);

        for (RoutineTemplate template : templates) {
            LocalDate date = weekStart.with(TemporalAdjusters.nextOrSame(template.getDayOfWeek()));
            boolean alreadyExists =
                    existing.stream()
                            .anyMatch(
                                    r ->
                                            r.getScheduledDate().equals(date)
                                                    && r.getBodyPart().equals(template.getBodyPart())
                                                    && r.getExerciseName().equals(template.getExerciseName()));
            boolean skipped = skipRepository.existsByTemplateIdAndSkippedDate(template.getId(), date);
            if (!alreadyExists && !skipped) {
                WorkoutRoutine routine =
                        new WorkoutRoutine(user, template.getBodyPart(), template.getExerciseName(), date);
                routine.setTemplateId(template.getId());
                routineRepository.save(routine);
            }
        }
    }

    public RoutineResponse create(String email, RoutineRequest request) {
        User user = findUser(email);
        WorkoutRoutine routine =
                new WorkoutRoutine(
                        user, request.bodyPart(), request.exerciseName(), request.scheduledDate());
        return RoutineResponse.from(routineRepository.save(routine));
    }

    public RoutineResponse toggleDone(String email, Long routineId) {
        WorkoutRoutine routine = findOwnedRoutine(email, routineId);
        routine.setDone(!routine.isDone());
        return RoutineResponse.from(routineRepository.save(routine));
    }

    // 템플릿에서 자동 생성된 루틴이면, 그 요일에 다시 안 생기게 스킵 기록을 남기고 지움
    public void delete(String email, Long routineId) {
        WorkoutRoutine routine = findOwnedRoutine(email, routineId);
        if (routine.getTemplateId() != null) {
            skipRepository.save(new RoutineTemplateSkip(routine.getTemplateId(), routine.getScheduledDate()));
        }
        routineRepository.delete(routine);
    }

    // 루틴을 찾고, 요청한 유저가 그 루틴의 소유자인지까지 확인 — toggleDone/delete가 공통으로 씀
    private WorkoutRoutine findOwnedRoutine(String email, Long routineId) {
        User user = findUser(email);
        WorkoutRoutine routine =
                routineRepository
                        .findById(routineId)
                        .orElseThrow(() -> new IllegalArgumentException("루틴을 찾을 수 없습니다."));

        if (!routine.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("본인의 루틴만 수정할 수 있습니다.");
        }
        return routine;
    }

    private User findUser(String email) {
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("사용자를 찾을 수 없습니다."));
    }
}
