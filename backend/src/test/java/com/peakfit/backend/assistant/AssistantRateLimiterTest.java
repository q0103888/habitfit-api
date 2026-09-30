package com.peakfit.backend.assistant;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.peakfit.backend.common.RateLimitExceededException;
import org.junit.jupiter.api.Test;

class AssistantRateLimiterTest {

    @Test
    void 한도_안에서는_통과한다() {
        AssistantRateLimiter limiter = new AssistantRateLimiter(3);
        assertThatCode(
                        () -> {
                            limiter.checkAndRecord("a@peakfit.app");
                            limiter.checkAndRecord("a@peakfit.app");
                            limiter.checkAndRecord("a@peakfit.app");
                        })
                .doesNotThrowAnyException();
    }

    @Test
    void 한도를_넘으면_예외를_던진다() {
        AssistantRateLimiter limiter = new AssistantRateLimiter(2);
        limiter.checkAndRecord("b@peakfit.app");
        limiter.checkAndRecord("b@peakfit.app");
        assertThatThrownBy(() -> limiter.checkAndRecord("b@peakfit.app"))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void 사용자별로_한도가_따로_적용된다() {
        AssistantRateLimiter limiter = new AssistantRateLimiter(1);
        limiter.checkAndRecord("c@peakfit.app");
        assertThatCode(() -> limiter.checkAndRecord("d@peakfit.app")).doesNotThrowAnyException();
    }
}
