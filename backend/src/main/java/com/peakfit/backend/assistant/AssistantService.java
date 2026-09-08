package com.peakfit.backend.assistant;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.helpers.BetaToolRunner;
import com.anthropic.models.beta.messages.BetaMessage;
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.fasterxml.jackson.annotation.JsonClassDescription;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.peakfit.backend.routine.RoutineService;
import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AssistantService {

    private static final String SYSTEM_PROMPT =
            "당신은 PeakFit이라는 운동 기록 앱의 운동 어시스턴트입니다. "
                    + "운동 방법, 프로그램 구성, 부상 예방 등 헬스/운동 관련 질문에 간결하게 답하세요. "
                    + "이 앱은 한국어/일본어를 지원하며, 사용자가 질문에 사용한 언어로 그대로 답하세요(다른 언어는 지원 안 한다고 말하지 마세요). "
                    + "사용자 본인의 실제 기록(연속 운동일수, 특정 운동의 기록 추이, 부위별 회복 상태, 부위별 운동 비중)에 "
                    + "관한 질문에는 반드시 제공된 도구로 실제 데이터를 조회한 뒤 답하세요. 추측해서 답하지 마세요. "
                    + "운동과 무관한 질문에는 답변을 정중히 거절하세요.";

    private final AnthropicClient client;
    private final String model;

    public AssistantService(
            @Value("${app.anthropic.api-key}") String apiKey,
            @Value("${app.anthropic.model}") String model,
            RoutineService routineService) {
        this.client = AnthropicOkHttpClient.builder().apiKey(apiKey).build();
        this.model = model;
        // 도구 클래스는 SDK가 리플렉션으로 직접 생성해서 생성자로 값을 못 넘겨줌 —
        // 앱 전체에 하나뿐인 RoutineService 싱글턴은 여기서 한 번만 정적 필드에 꽂아둠
        ToolContext.routineService = routineService;
    }

    // email은 JWT에서 나온 값(컨트롤러가 Principal로 넘겨줌)이라 모델이 조작할 수 없음.
    // 도구가 실행되는 동안만 스레드로컬에 담아뒀다가 끝나면 반드시 지움.
    // history는 프론트(localStorage)가 보낸 이전 대화 — Claude API는 매 요청이 독립적이라
    // 이어서 대화하려면 이전 질문/답변을 다시 메시지로 재구성해서 앞에 붙여줘야 함
    public String ask(String email, String question, List<AskRequest.HistoryItem> history) {
        ToolContext.email.set(email);
        try {
            MessageCreateParams.Builder builder =
                    MessageCreateParams.builder()
                            .model(model)
                            .maxTokens(1024L)
                            .system(SYSTEM_PROMPT)
                            .putAdditionalHeader("anthropic-beta", "structured-outputs-2025-11-13")
                            .addTool(GetStreak.class)
                            .addTool(GetExerciseHistory.class)
                            .addTool(GetRecoveryStatus.class)
                            .addTool(GetBodyPartSummary.class);

            if (history != null) {
                for (AskRequest.HistoryItem h : history) {
                    builder.addUserMessage(h.question());
                    builder.addAssistantMessage(h.answer());
                }
            }
            builder.addUserMessage(question);

            BetaToolRunner toolRunner = client.beta().messages().toolRunner(builder.build());

            BetaMessage last = null;
            for (BetaMessage message : toolRunner) {
                last = message;
            }
            if (last == null) return "";
            return last.content().stream()
                    .flatMap(block -> block.text().stream())
                    .map(text -> text.text())
                    .collect(Collectors.joining());
        } finally {
            ToolContext.email.remove();
        }
    }

    @JsonClassDescription("사용자의 현재 연속 운동일수(스트릭)를 조회한다")
    static class GetStreak implements Supplier<String> {
        @JsonPropertyDescription("이 도구를 호출하는 이유를 한 줄로 적는다(값 자체는 사용하지 않음, 매개변수 없는 도구라 스키마상 최소 1개 필드가 필요해서 넣음)")
        public String reason;

        @Override
        public String get() {
            int streak = ToolContext.routineService.calculateStreak(ToolContext.email.get());
            return streak + "일 연속";
        }
    }

    @JsonClassDescription("특정 운동 종목의 날짜별 최고 무게/총 볼륨 기록 히스토리를 조회한다")
    static class GetExerciseHistory implements Supplier<String> {
        @JsonPropertyDescription("조회할 운동 이름(한국어 그대로), 예: 벤치프레스")
        public String exerciseName;

        @Override
        public String get() {
            var history = ToolContext.routineService.exerciseHistory(ToolContext.email.get(), exerciseName);
            if (history.isEmpty()) return "기록 없음";
            return history.stream()
                    .map(
                            h ->
                                    h.date()
                                            + ": 최고 "
                                            + h.maxWeightKg()
                                            + "kg, 총 볼륨 "
                                            + h.totalVolumeKg()
                                            + "kg, 세트 "
                                            + h.totalSets()
                                            + "개")
                    .collect(Collectors.joining("\n"));
        }
    }

    @JsonClassDescription("부위별로 가장 최근에 운동한 날짜(회복 상태)를 조회한다")
    static class GetRecoveryStatus implements Supplier<String> {
        @JsonPropertyDescription("이 도구를 호출하는 이유를 한 줄로 적는다(값 자체는 사용하지 않음, 매개변수 없는 도구라 스키마상 최소 1개 필드가 필요해서 넣음)")
        public String reason;

        @Override
        public String get() {
            var status = ToolContext.routineService.recoveryStatus(ToolContext.email.get());
            if (status.isEmpty()) return "완료된 운동 기록 없음";
            return status.stream()
                    .map(s -> s.bodyPart() + ": 마지막 운동 " + s.lastTrainedDate())
                    .collect(Collectors.joining("\n"));
        }
    }

    @JsonClassDescription("최근 30일간 부위별 운동 횟수 비중을 조회한다")
    static class GetBodyPartSummary implements Supplier<String> {
        @JsonPropertyDescription("이 도구를 호출하는 이유를 한 줄로 적는다(값 자체는 사용하지 않음, 매개변수 없는 도구라 스키마상 최소 1개 필드가 필요해서 넣음)")
        public String reason;

        @Override
        public String get() {
            var summary = ToolContext.routineService.bodyPartSummary(ToolContext.email.get());
            if (summary.isEmpty()) return "기록 없음";
            return summary.stream()
                    .map(s -> s.bodyPart() + ": " + s.count() + "회")
                    .collect(Collectors.joining("\n"));
        }
    }

    private static final class ToolContext {
        static final ThreadLocal<String> email = new ThreadLocal<>();
        static RoutineService routineService;
    }
}
