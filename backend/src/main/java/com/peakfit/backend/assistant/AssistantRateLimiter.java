package com.peakfit.backend.assistant;

import com.peakfit.backend.common.RateLimitExceededException;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// ponytail: 카운트를 인스턴스 메모리에만 저장 — 서버 재시작 시 리셋되고, Render를 다중
// 인스턴스로 스케일하면 사용자별 카운트가 인스턴스마다 따로 셈. 지금은 무료 플랜 단일
// 인스턴스라 문제 없음 — 인스턴스를 늘리게 되면 DB나 Redis 기반 카운터로 교체할 것.
@Component
public class AssistantRateLimiter {

    private final int maxPerDay;
    private final Map<String, Counter> counters = new ConcurrentHashMap<>();

    public AssistantRateLimiter(@Value("${app.assistant.rate-limit.max-per-day}") int maxPerDay) {
        this.maxPerDay = maxPerDay;
    }

    // 오늘 한도를 이미 넘겼으면 예외를 던지고, 아니면 카운트를 1 늘림
    public void checkAndRecord(String email) {
        Counter counter = counters.computeIfAbsent(email, key -> new Counter());
        synchronized (counter) {
            LocalDate today = LocalDate.now();
            if (!today.equals(counter.day)) {
                counter.day = today;
                counter.count.set(0);
            }
            if (counter.count.get() >= maxPerDay) {
                throw new RateLimitExceededException(
                        "AI 코치 사용량 한도(하루 " + maxPerDay + "회)를 초과했습니다. 내일 다시 시도해주세요.");
            }
            counter.count.incrementAndGet();
        }
    }

    private static final class Counter {
        volatile LocalDate day = LocalDate.now();
        final AtomicInteger count = new AtomicInteger();
    }
}
