package com.peakfit.backend.routine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.peakfit.backend.user.User;
import com.peakfit.backend.user.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

// RoutineService의 로직 중 실제로 버그가 났었거나(toggleDone save 누락, 스트릭 계산 등)
// 조건 분기가 복잡한 부분만 골라서 검증. 리포지토리는 전부 Mockito로 가짜(mock) 처리해서
// 실제 DB 없이 서비스 로직만 빠르게 테스트함
@ExtendWith(MockitoExtension.class)
class RoutineServiceTest {

    @Mock private WorkoutRoutineRepository routineRepository;
    @Mock private WorkoutSetRepository setRepository;
    @Mock private RoutineTemplateRepository templateRepository;
    @Mock private RoutineTemplateSkipRepository skipRepository;
    @Mock private UserRepository userRepository;

    private RoutineService service;
    private User user;
    private static final String EMAIL = "test@peakfit.app";

    @BeforeEach
    void setUp() {
        service =
                new RoutineService(routineRepository, setRepository, templateRepository, skipRepository, userRepository);
        user = new User(EMAIL, "hash", "성", "이름", LocalDate.of(2000, 1, 1), "KR");
        user.setId(1L);
    }

    private WorkoutRoutine routine(String bodyPart, String exerciseName, LocalDate date, boolean done) {
        WorkoutRoutine r = new WorkoutRoutine(user, bodyPart, exerciseName, date);
        r.setDone(done);
        return r;
    }

    // ---------- calculateStreak ----------

    @Test
    void calculateStreak_모든_날이_완료면_전부_카운트된다() {
        LocalDate today = LocalDate.now();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findByUserAndScheduledDateBetween(eq(user), any(), any()))
                .thenReturn(
                        List.of(
                                routine("CHEST", "벤치프레스", today, true),
                                routine("BACK", "데드리프트", today.minusDays(1), true),
                                routine("LEG", "스쿼트", today.minusDays(2), true)));

        assertThat(service.calculateStreak(EMAIL)).isEqualTo(3);
    }

    @Test
    void calculateStreak_루틴이_없는_휴식일은_스트릭을_끊지_않는다() {
        LocalDate today = LocalDate.now();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        // 어제는 루틴 자체가 없음(휴식일) — today와 그제만 존재
        when(routineRepository.findByUserAndScheduledDateBetween(eq(user), any(), any()))
                .thenReturn(
                        List.of(
                                routine("CHEST", "벤치프레스", today, true),
                                routine("LEG", "스쿼트", today.minusDays(2), true)));

        assertThat(service.calculateStreak(EMAIL)).isEqualTo(2);
    }

    @Test
    void calculateStreak_오늘이_미완료여도_끊기지_않지만_과거_미완료는_끊는다() {
        LocalDate today = LocalDate.now();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findByUserAndScheduledDateBetween(eq(user), any(), any()))
                .thenReturn(
                        List.of(
                                routine("CHEST", "벤치프레스", today, false), // 오늘 미완료 — 예외적으로 안 끊김
                                routine("BACK", "데드리프트", today.minusDays(1), true), // 어제는 완료 — 카운트
                                routine("LEG", "스쿼트", today.minusDays(2), false))); // 그제 미완료 — 여기서 끊김

        assertThat(service.calculateStreak(EMAIL)).isEqualTo(1);
    }

    @Test
    void calculateStreak_기록이_전혀_없으면_0이다() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findByUserAndScheduledDateBetween(eq(user), any(), any())).thenReturn(List.of());

        assertThat(service.calculateStreak(EMAIL)).isEqualTo(0);
    }

    // ---------- exerciseHistory ----------

    @Test
    void exerciseHistory_최고무게와_총볼륨을_계산하고_세트없는_날은_제외한다() {
        WorkoutRoutine day1 = routine("CHEST", "벤치프레스", LocalDate.of(2026, 1, 1), true);
        day1.setId(10L);
        WorkoutRoutine day2NoSets = routine("CHEST", "벤치프레스", LocalDate.of(2026, 1, 3), true);
        day2NoSets.setId(11L);

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findByUserAndExerciseNameOrderByScheduledDateAsc(user, "벤치프레스"))
                .thenReturn(List.of(day1, day2NoSets));
        when(setRepository.findByRoutineIdInOrderByRoutineIdAscSetNumberAsc(List.of(10L, 11L)))
                .thenReturn(
                        List.of(
                                new WorkoutSet(10L, 1, 60.0, 10),
                                new WorkoutSet(10L, 2, 65.0, 8)));

        List<ExerciseHistoryPoint> history = service.exerciseHistory(EMAIL, "벤치프레스");

        assertThat(history).hasSize(1); // 세트 없는 day2는 제외
        assertThat(history.get(0).date()).isEqualTo(LocalDate.of(2026, 1, 1));
        assertThat(history.get(0).maxWeightKg()).isEqualTo(65.0);
        assertThat(history.get(0).totalVolumeKg()).isEqualTo(60.0 * 10 + 65.0 * 8);
        assertThat(history.get(0).totalSets()).isEqualTo(2);
    }

    // ---------- recoveryStatus ----------

    @Test
    void recoveryStatus_완료된_루틴만_보고_가장_최근_날짜를_고른다() {
        LocalDate today = LocalDate.now();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findByUserAndScheduledDateBetween(eq(user), any(), any()))
                .thenReturn(
                        List.of(
                                routine("CHEST", "벤치프레스", today.minusDays(5), true),
                                routine("CHEST", "인클라인 벤치프레스", today.minusDays(2), true),
                                routine("CHEST", "푸시업", today, false))); // 미완료라 제외돼야 함

        List<BodyPartRecoveryPoint> result = service.recoveryStatus(EMAIL);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).bodyPart()).isEqualTo("CHEST");
        assertThat(result.get(0).lastTrainedDate()).isEqualTo(today.minusDays(2));
    }

    @Test
    void recoveryStatus_완료된_기록이_전혀_없으면_그_부위는_목록에서_빠진다() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findByUserAndScheduledDateBetween(eq(user), any(), any()))
                .thenReturn(List.of(routine("CHEST", "벤치프레스", LocalDate.now(), false)));

        assertThat(service.recoveryStatus(EMAIL)).isEmpty();
    }

    // ---------- toggleDone (실제로 save() 누락 버그가 있었던 부분) ----------

    @Test
    void toggleDone_완료여부를_뒤집고_반드시_save를_호출한다() {
        WorkoutRoutine r = routine("CHEST", "벤치프레스", LocalDate.now(), false);
        r.setId(5L);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findById(5L)).thenReturn(Optional.of(r));
        when(setRepository.findByRoutineIdInOrderByRoutineIdAscSetNumberAsc(List.of(5L))).thenReturn(List.of());

        RoutineResponse response = service.toggleDone(EMAIL, 5L);

        assertThat(response.done()).isTrue();
        // detached 엔티티라 save()를 안 부르면 DB에 반영이 안 됐던 버그의 재발 방지 테스트
        verify(routineRepository, times(1)).save(r);
    }

    @Test
    void toggleDone_다른_사람의_루틴이면_거부한다() {
        User owner = new User("owner@peakfit.app", "hash", "성", "이름", LocalDate.of(2000, 1, 1), "KR");
        owner.setId(99L);
        WorkoutRoutine r = routine("CHEST", "벤치프레스", LocalDate.now(), false);
        r.setUser(owner);
        r.setId(5L);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findById(5L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> service.toggleDone(EMAIL, 5L)).isInstanceOf(AccessDeniedException.class);
    }

    // ---------- delete (템플릿 스킵 기록 + 세트 cascade) ----------

    @Test
    void delete_템플릿에서_나온_루틴이면_스킵을_기록하고_세트도_지운다() {
        WorkoutRoutine r = routine("CHEST", "벤치프레스", LocalDate.of(2026, 5, 1), false);
        r.setId(7L);
        r.setTemplateId(3L);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findById(7L)).thenReturn(Optional.of(r));

        service.delete(EMAIL, 7L);

        verify(skipRepository, times(1)).save(any(RoutineTemplateSkip.class));
        verify(setRepository, times(1)).deleteByRoutineId(7L);
        verify(routineRepository, times(1)).delete(r);
    }

    @Test
    void delete_수동으로_추가한_루틴이면_스킵을_기록하지_않는다() {
        WorkoutRoutine r = routine("CHEST", "벤치프레스", LocalDate.of(2026, 5, 1), false);
        r.setId(8L); // templateId 없음 = 수동 추가
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(routineRepository.findById(8L)).thenReturn(Optional.of(r));

        service.delete(EMAIL, 8L);

        verify(skipRepository, never()).save(any());
        verify(setRepository, times(1)).deleteByRoutineId(8L);
    }
}
