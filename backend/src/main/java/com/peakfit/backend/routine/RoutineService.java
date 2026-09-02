package com.peakfit.backend.routine;

import com.peakfit.backend.user.User;
import com.peakfit.backend.user.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 루틴(WorkoutRoutine)의 조회/생성/완료토글/삭제 + 세트 기록 + 연속 달성일 계산을 담당.
// 반복 템플릿 규칙 자체의 CRUD는 RoutineTemplateService가 따로 맡음
@Service
public class RoutineService {

    private final WorkoutRoutineRepository routineRepository;
    private final WorkoutSetRepository setRepository;
    private final RoutineTemplateRepository templateRepository;
    private final RoutineTemplateSkipRepository skipRepository;
    private final UserRepository userRepository;

    public RoutineService(
            WorkoutRoutineRepository routineRepository,
            WorkoutSetRepository setRepository,
            RoutineTemplateRepository templateRepository,
            RoutineTemplateSkipRepository skipRepository,
            UserRepository userRepository) {
        this.routineRepository = routineRepository;
        this.setRepository = setRepository;
        this.templateRepository = templateRepository;
        this.skipRepository = skipRepository;
        this.userRepository = userRepository;
    }

    // date가 없으면 오늘 날짜 기준으로 조회
    public List<RoutineResponse> list(String email, LocalDate date) {
        User user = findUser(email);
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return toResponses(routineRepository.findByUserAndScheduledDate(user, targetDate));
    }

    // anchor가 속한 주(월요일~일요일) 전체 루틴 조회 — 주간 기록 그래프/달성률 계산용.
    // 반복 템플릿이 있으면, 이번 주에 아직 실제로 만들어지지 않은 요일만 채워 넣음
    public List<RoutineResponse> listWeek(String email, LocalDate anchor) {
        User user = findUser(email);
        LocalDate reference = anchor != null ? anchor : LocalDate.now();
        LocalDate weekStart = reference.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = reference.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        materializeTemplates(user, weekStart);

        return toResponses(routineRepository.findByUserAndScheduledDateBetween(user, weekStart, weekEnd));
    }

    // anchor가 속한 달 전체 루틴 조회 — 캘린더 화면용. 그 달에 걸치는 모든 주(월~일)에 대해
    // 반복 템플릿을 미리 materialize해서, 아직 안 지난 미래 날짜에도 반복 루틴이 미리 보이게 함
    public List<RoutineResponse> listMonth(String email, LocalDate anchor) {
        User user = findUser(email);
        LocalDate reference = anchor != null ? anchor : LocalDate.now();
        LocalDate monthStart = reference.withDayOfMonth(1);
        LocalDate monthEnd = reference.withDayOfMonth(reference.lengthOfMonth());

        // 반복 템플릿 미리보기는 오늘로부터 2주 뒤까지만 — 그 이상 미래는 실제 그 날짜가 다가와야 생성됨.
        // (안 그러면 캘린더를 몇 년 뒤로 넘겨도 똑같은 루틴이 끝없이 "예정"으로 보임)
        LocalDate materializeCap = LocalDate.now().plusDays(14);
        LocalDate weekStart = monthStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        while (!weekStart.isAfter(monthEnd) && !weekStart.isAfter(materializeCap)) {
            materializeTemplates(user, weekStart);
            weekStart = weekStart.plusWeeks(1);
        }

        return toResponses(routineRepository.findByUserAndScheduledDateBetween(user, monthStart, monthEnd));
    }

    // 루틴 목록 여러 개에 대한 세트를 한 번에 조회해서 매핑 (루틴마다 따로 쿼리 안 날리게 함)
    private List<RoutineResponse> toResponses(List<WorkoutRoutine> routines) {
        if (routines.isEmpty()) return List.of();
        List<Long> ids = routines.stream().map(WorkoutRoutine::getId).toList();
        Map<Long, List<WorkoutSet>> setsByRoutine =
                setRepository.findByRoutineIdInOrderByRoutineIdAscSetNumberAsc(ids).stream()
                        .collect(Collectors.groupingBy(WorkoutSet::getRoutineId));
        return routines.stream()
                .map(r -> RoutineResponse.from(r, setsByRoutine.getOrDefault(r.getId(), List.of())))
                .toList();
    }

    private RoutineResponse toResponse(WorkoutRoutine routine) {
        List<WorkoutSet> sets =
                setRepository.findByRoutineIdInOrderByRoutineIdAscSetNumberAsc(List.of(routine.getId()));
        return RoutineResponse.from(routine, sets);
    }

    // 이 운동을 언제 얼마나 무겁게 들었는지 시간순으로 — 통계 화면 그래프용.
    // 세트 기록이 하나도 없는 날(무게 입력 없이 완료 체크만 한 경우)은 그래프에서 제외
    public List<ExerciseHistoryPoint> exerciseHistory(String email, String exerciseName) {
        User user = findUser(email);
        List<WorkoutRoutine> routines =
                routineRepository.findByUserAndExerciseNameOrderByScheduledDateAsc(user, exerciseName);
        if (routines.isEmpty()) return List.of();

        List<Long> ids = routines.stream().map(WorkoutRoutine::getId).toList();
        Map<Long, List<WorkoutSet>> setsByRoutine =
                setRepository.findByRoutineIdInOrderByRoutineIdAscSetNumberAsc(ids).stream()
                        .collect(Collectors.groupingBy(WorkoutSet::getRoutineId));

        return routines.stream()
                .map(
                        r -> {
                            List<WorkoutSet> sets = setsByRoutine.getOrDefault(r.getId(), List.of());
                            double maxWeight =
                                    sets.stream().mapToDouble(WorkoutSet::getWeightKg).max().orElse(0);
                            double totalVolume =
                                    sets.stream().mapToDouble(s -> s.getWeightKg() * s.getReps()).sum();
                            return new ExerciseHistoryPoint(
                                    r.getScheduledDate(), maxWeight, totalVolume, sets.size());
                        })
                .filter(p -> p.totalSets() > 0)
                .toList();
    }

    // 최근 30일간 부위별로 루틴을 몇 번 했는지 — 통계 화면 부위 비중 도넛차트용
    public List<BodyPartSummaryPoint> bodyPartSummary(String email) {
        User user = findUser(email);
        LocalDate today = LocalDate.now();
        List<WorkoutRoutine> routines =
                routineRepository.findByUserAndScheduledDateBetween(user, today.minusDays(30), today);

        return routines.stream()
                .collect(Collectors.groupingBy(WorkoutRoutine::getBodyPart, Collectors.counting()))
                .entrySet()
                .stream()
                .map(e -> new BodyPartSummaryPoint(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .toList();
    }

    // 부위별 마지막 완료 훈련 날짜 — 통계 화면 "회복 상태" 카드용. 최근 60일만 봐도 충분해서 그 안에서만 조회
    public List<BodyPartRecoveryPoint> recoveryStatus(String email) {
        User user = findUser(email);
        LocalDate today = LocalDate.now();
        return routineRepository.findByUserAndScheduledDateBetween(user, today.minusDays(60), today).stream()
                .filter(WorkoutRoutine::isDone)
                .collect(
                        Collectors.groupingBy(
                                WorkoutRoutine::getBodyPart,
                                Collectors.mapping(WorkoutRoutine::getScheduledDate, Collectors.maxBy(LocalDate::compareTo))))
                .entrySet().stream()
                .filter(e -> e.getValue().isPresent())
                .map(e -> new BodyPartRecoveryPoint(e.getKey(), e.getValue().get()))
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

    // 1회성 루틴 생성 — templateId는 안 채워지므로(null) 반복 규칙과 무관한 수동 추가로 남음
    public RoutineResponse create(String email, RoutineRequest request) {
        User user = findUser(email);
        WorkoutRoutine routine =
                new WorkoutRoutine(
                        user, request.bodyPart(), request.exerciseName(), request.scheduledDate());
        return RoutineResponse.from(routineRepository.save(routine), List.of());
    }

    // 완료 여부를 반대로 뒤집고 저장. findById로 가져온 엔티티는 그 호출이 끝나면 detached 상태라
    // save()를 명시적으로 안 부르면 값만 바뀌고 DB엔 반영이 안 됨(실제로 겪었던 버그)
    public RoutineResponse toggleDone(String email, Long routineId) {
        WorkoutRoutine routine = findOwnedRoutine(email, routineId);
        routine.setDone(!routine.isDone());
        routineRepository.save(routine);
        return toResponse(routine);
    }

    // 새 세트 기록 추가 — 세트 번호는 지금까지 기록된 개수+1로 자동 매김
    public RoutineResponse addSet(String email, Long routineId, WorkoutSetRequest request) {
        WorkoutRoutine routine = findOwnedRoutine(email, routineId);
        int nextSetNumber = (int) setRepository.countByRoutineId(routineId) + 1;
        setRepository.save(new WorkoutSet(routineId, nextSetNumber, request.weightKg(), request.reps()));
        return toResponse(routine);
    }

    // 세트 기록 삭제 (잘못 입력한 세트 지울 때)
    public RoutineResponse deleteSet(String email, Long routineId, Long setId) {
        WorkoutRoutine routine = findOwnedRoutine(email, routineId);
        WorkoutSet set =
                setRepository.findById(setId).orElseThrow(() -> new IllegalArgumentException("세트를 찾을 수 없습니다."));
        if (!set.getRoutineId().equals(routineId)) {
            throw new IllegalArgumentException("이 루틴의 세트가 아닙니다.");
        }
        setRepository.delete(set);
        return toResponse(routine);
    }

    // 템플릿에서 자동 생성된 루틴이면, 그 요일에 다시 안 생기게 스킵 기록을 남기고 지움.
    // 딸려있던 세트 기록도 같이 정리 (bulk delete라 트랜잭션 필요)
    @Transactional
    public void delete(String email, Long routineId) {
        WorkoutRoutine routine = findOwnedRoutine(email, routineId);
        if (routine.getTemplateId() != null) {
            skipRepository.save(new RoutineTemplateSkip(routine.getTemplateId(), routine.getScheduledDate()));
        }
        setRepository.deleteByRoutineId(routineId);
        routineRepository.delete(routine);
    }

    // 오늘부터 거꾸로 세면서 "그 날 예정된 루틴이 전부 완료"인 날만 스트릭에 포함.
    // 루틴이 아예 없는 날(휴식일)은 스트릭에 영향 없이 그냥 건너뜀.
    // 오늘은 아직 안 끝났을 수 있으니, 루틴이 있어도 미완료면 끊지 않고 어제부터 계산 이어감
    public int calculateStreak(String email) {
        User user = findUser(email);
        LocalDate today = LocalDate.now();
        LocalDate rangeStart = today.minusDays(400);
        Map<LocalDate, List<WorkoutRoutine>> byDate =
                routineRepository.findByUserAndScheduledDateBetween(user, rangeStart, today).stream()
                        .collect(Collectors.groupingBy(WorkoutRoutine::getScheduledDate));

        int streak = 0;
        LocalDate date = today;
        while (!date.isBefore(rangeStart)) {
            List<WorkoutRoutine> dayRoutines = byDate.get(date);
            if (dayRoutines == null || dayRoutines.isEmpty()) {
                date = date.minusDays(1);
                continue;
            }

            boolean achieved = dayRoutines.stream().allMatch(WorkoutRoutine::isDone);
            if (achieved) {
                streak++;
            } else if (!date.equals(today)) {
                break;
            }
            date = date.minusDays(1);
        }
        return streak;
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
