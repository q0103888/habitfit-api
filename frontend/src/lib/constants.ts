// 대시보드/루틴 페이지에서 공통으로 쓰는 상수 — 부위는 DB에 영어 코드로 저장.
// 화면 라벨은 언어별로 달라지므로 lib/i18n.tsx의 bodyPartLabel(code, t)에서 가져옴
export const BODY_PARTS = [
  { code: "CHEST" },
  { code: "BACK" },
  { code: "SHOULDER" },
  { code: "LEG" },
  { code: "ARM_ABS" },
  { code: "CARDIO" },
];

// toISOString()은 UTC로 변환해서 자정 근처(한국 기준 00~08시)엔 날짜가 하루 밀릴 수 있음 —
// 로컬 달력 기준으로 직접 "YYYY-MM-DD" 문자열을 만들어서 그 문제를 피함
export function toDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// date가 속한 주의 월요일을 반환
export function getMonday(date: Date) {
  const result = new Date(date);
  const day = result.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}
