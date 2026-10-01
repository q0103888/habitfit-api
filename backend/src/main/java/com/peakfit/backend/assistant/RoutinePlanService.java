package com.peakfit.backend.assistant;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.StructuredMessageCreateParams;
import com.peakfit.backend.exercise.Exercise;
import com.peakfit.backend.exercise.ExerciseRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// AI 루틴 자동 생성 — AssistantService(대화형 코치, 도구 호출 루프)와 달리 이건 한 번의
// 질문-답변으로 끝나는 단건 생성이라 structured output으로 바로 타입이 맞는 JSON을 받음.
// 종목명은 ExerciseRepository에서 실제로 존재하는 이름만 프롬프트에 넣어줘서, Claude가 없는
// 종목 이름을 지어내지 않고 그 안에서만 고르게 함
@Service
public class RoutinePlanService {

    private final AnthropicClient client;
    private final String model;
    private final ExerciseRepository exerciseRepository;
    private final AssistantRateLimiter rateLimiter;

    public RoutinePlanService(
            @Value("${app.anthropic.api-key}") String apiKey,
            @Value("${app.anthropic.model}") String model,
            ExerciseRepository exerciseRepository,
            AssistantRateLimiter rateLimiter) {
        this.client = AnthropicOkHttpClient.builder().apiKey(apiKey).build();
        this.model = model;
        this.exerciseRepository = exerciseRepository;
        this.rateLimiter = rateLimiter;
    }

    public RoutinePlanResponse generate(String email, RoutinePlanRequest request) {
        // AI 코치 챗봇과 같은 하루 호출 한도를 공유 — 이 생성도 Claude API 비용이 드는 건 동일
        rateLimiter.checkAndRecord(email);

        List<String> bodyParts =
                request.days().stream().flatMap(d -> d.bodyParts().stream()).distinct().toList();
        Map<String, List<String>> namesByBodyPart =
                exerciseRepository.findByBodyPartIn(bodyParts).stream()
                        .collect(Collectors.groupingBy(
                                Exercise::getBodyPart, Collectors.mapping(Exercise::getName, Collectors.toList())));

        StructuredMessageCreateParams<RoutinePlanResponse> params =
                MessageCreateParams.builder()
                        .model(model)
                        .maxTokens(4096L)
                        .outputConfig(RoutinePlanResponse.class)
                        .addUserMessage(buildPrompt(request, namesByBodyPart))
                        .build();

        return client.messages().create(params).content().stream()
                .flatMap(block -> block.text().stream())
                .findFirst()
                .map(typed -> typed.text())
                .orElseThrow(() -> new IllegalStateException("AI가 루틴 생성에 실패했습니다. 다시 시도해주세요."));
    }

    private String buildPrompt(RoutinePlanRequest request, Map<String, List<String>> namesByBodyPart) {
        StringBuilder sb = new StringBuilder();
        sb.append("운동 루틴을 짜는 트레이너입니다. 사용자 숙련도: ")
                .append(request.level())
                .append(", 세션당 운동 시간: ")
                .append(request.sessionDurationMin())
                .append("분.\n")
                .append("숙련도가 낮을수록 종목 수를 줄이고 쉬운 동작 위주로, 세션 시간이 길수록 종목 수를 늘려서 구성하세요.\n")
                .append("각 요일에 배정된 부위마다, 반드시 아래 '사용 가능한 종목' 목록에 있는 이름만 그대로 선택하세요. ")
                .append("목록에 없는 이름은 절대 만들어내지 마세요.\n\n");
        for (RoutinePlanRequest.DaySplit day : request.days()) {
            sb.append("- ").append(day.dayOfWeek()).append(": ");
            for (String bodyPart : day.bodyParts()) {
                sb.append(bodyPart)
                        .append("(사용 가능한 종목: ")
                        .append(String.join(", ", namesByBodyPart.getOrDefault(bodyPart, List.of())))
                        .append(") ");
            }
            sb.append("\n");
        }
        return sb.toString();
    }
}
