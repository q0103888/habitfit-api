import { describe, expect, test } from "vitest";
import { toDateStr, getMonday } from "./constants";

describe("toDateStr", () => {
  test("한 자리 월/일도 0을 채워서 YYYY-MM-DD로 만든다", () => {
    expect(toDateStr(new Date(2026, 0, 5))).toBe("2026-01-05"); // month는 0-indexed(1월=0)
  });

  test("toISOString과 달리 로컬 자정 기준 날짜를 그대로 쓴다", () => {
    // 이 값이 흔들리면(UTC 변환 등) 자정 근처 한국 사용자의 캘린더/루틴 날짜가 하루 밀림
    expect(toDateStr(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("getMonday", () => {
  test("평일이면 그 주의 월요일로 되돌린다", () => {
    const wednesday = new Date(2026, 8, 9); // 2026-09-09는 수요일
    expect(toDateStr(getMonday(wednesday))).toBe("2026-09-07");
  });

  test("일요일이면 하루 전이 아니라 그 주가 시작된 월요일로 되돌린다", () => {
    // getDay()===0(일)은 "1 - day" 공식이 그대로 안 맞아서 별도 분기가 필요했던 케이스
    const sunday = new Date(2026, 8, 13); // 2026-09-13은 일요일
    expect(toDateStr(getMonday(sunday))).toBe("2026-09-07");
  });

  test("월요일 자신이면 그대로 반환한다", () => {
    const monday = new Date(2026, 8, 7);
    expect(toDateStr(getMonday(monday))).toBe("2026-09-07");
  });
});
