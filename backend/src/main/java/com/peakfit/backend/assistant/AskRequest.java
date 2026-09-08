package com.peakfit.backend.assistant;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

// 빈 질문으로 API를 호출하면 돈만 나가고 의미가 없어서 @NotBlank로 미리 막음.
// history는 프론트(localStorage)가 들고 있는 이전 대화 내역 — Claude API는 매 요청이
// 독립적이라, 이전 대화를 이어가려면 이렇게 매번 같이 보내줘야 함
public record AskRequest(@NotBlank String question, List<HistoryItem> history) {

    public record HistoryItem(String question, String answer) {}
}
