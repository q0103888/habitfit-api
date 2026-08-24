// 대시보드/루틴 페이지에서 공통으로 쓰는 상수 — 부위는 DB에 영어 코드로 저장하고 화면엔 한글로 표시
export const BODY_PARTS = [
  { code: "CHEST", label: "가슴" },
  { code: "BACK", label: "등" },
  { code: "SHOULDER", label: "어깨" },
  { code: "LEG", label: "하체" },
  { code: "ARM_ABS", label: "팔+복근" },
];

export function bodyPartLabel(code: string) {
  return BODY_PARTS.find((p) => p.code === code)?.label ?? code;
}

// 월요일 시작 — 백엔드 listWeek()의 주 경계(월~일)와 맞춤
export const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

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
