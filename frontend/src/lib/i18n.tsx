"use client";

// 경량 자체 i18n — 외부 라이브러리 없이 딕셔너리 + Context만으로 구현.
// ja를 기준(as const)으로 삼고 ko를 Record<Key, string>으로 타이핑해서,
// 두 언어의 키 집합이 어긋나면(하나라도 빠지거나 더 있으면) 컴파일 에러로 바로 잡힘 —
// "번역 누락"을 타입체커가 검증해주는 셈
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "ko" | "ja";

const ja = {
  "nav.dashboard": "ダッシュボード",
  "nav.routine": "ルーティン",
  "nav.calendar": "カレンダー",
  "nav.exercises": "種目図鑑",
  "nav.stats": "統計",
  "nav.team": "チーム",
  "nav.settings": "設定",
  "nav.help": "ヘルプ",
  "nav.logout": "ログアウト",
  "nav.menu": "メニュー",
  "nav.general": "一般",
  "nav.tipOfDay": "今日のヒント",

  "tip.1": "運動前は5分ストレッチでケガを予防しましょう。",
  "tip.2": "運動後30分以内にタンパク質を摂ると回復が早まります。",
  "tip.3": "運動中も少しずつこまめに水分補給しましょう。",
  "tip.4": "同じ部位は48時間ほど休ませると筋肉が回復します。",
  "tip.5": "重量よりも正しいフォームがケガ予防に大切です。",
  "tip.6": "十分な睡眠は運動と同じくらい筋肉の成長に重要です。",
  "tip.7": "ウォームアップセットから始めるとメインセットでのケガを減らせます。",
  "tip.8": "力を入れるときに息を吐くのが呼吸の基本です。",
  "tip.9": "ルーティンは強度より継続が大切です。",
  "tip.10": "軽い有酸素運動から始めると関節への負担が減ります。",

  "common.add": "追加",
  "common.record": "記録",
  "common.selectExercise": "種目を選択",
  "common.noSetsYet": "まだ記録されたセットがありません。",
  "common.weightKgPlaceholder": "重量(kg)",
  "common.repsPlaceholder": "回数",
  "common.repUnit": "回",
  "common.addSet": "セット追加",
  "common.setCount": "{n}セット",
  "common.setLine": "{n}セット — {weight}kg x {reps}回",
  "common.confirm": "確認",
  "common.checking": "確認中...",
  "common.routine": "ルーティン",
  "common.logoAlt": "PeakFitロゴ",
  "common.noData": "まだデータがありません。",

  "dashboard.searchPlaceholder": "種目またはルーティンを検索",
  "dashboard.greetingSuffix": "さん",
  "dashboard.kicker": "今日も頑張ろう",
  "dashboard.heroTitle": "限界を超える時間です",
  "dashboard.streakSuffix": "日連続達成中",
  "dashboard.addRoutine": "ルーティン追加",
  "dashboard.inviteMember": "メンバー招待",
  "dashboard.weeklyRecord": "今週の運動記録",
  "dashboard.weeklyGoalRate": "今週の達成率",
  "dashboard.weeklyGoalHint": "目標まであと少しです",
  "dashboard.todayDone": "本日完了",
  "dashboard.almostThere": "もう少し!",
  "dashboard.todayReminder": "今日のリマインダー",
  "dashboard.remainingRoutines": "残りのルーティン {n}件",
  "dashboard.startRoutine": "ルーティン開始",
  "dashboard.noRoutinesToday": "今日登録されたルーティンがありません。",
  "dashboard.allDoneToday": "今日のルーティンを全て完了しました!",
  "dashboard.todayRoutines": "今日のルーティン",
  "dashboard.teamCollab": "チームコラボレーション",
  "dashboard.addMember": "メンバー追加",
  "dashboard.status.done": "完了",
  "dashboard.status.inProgress": "進行中",
  "dashboard.status.notDone": "未完了",
  "dashboard.weeklyGoalDonut": "週間目標達成率",
  "dashboard.vsGoal": "目標対比",
  "dashboard.achieved": "達成",
  "dashboard.remaining": "残り",
  "dashboard.streakTitle": "連続達成日",
  "dashboard.streakDaySuffix": "日目",
  "dashboard.streakHint": "このペースを維持すれば今月最高記録です。",
  "dashboard.bodyWeightRecord": "体重記録",
  "dashboard.noRecord": "記録なし",
  "dashboard.todayWeightPlaceholder": "今日の体重(kg)",

  "routine.title": "ルーティン管理",
  "routine.subtitle": "今週のルーティンをその都度追加するか、毎週繰り返すルーティンを設定してください。",
  "routine.thisWeek": "今週のルーティン",
  "routine.todaySuffix": "・今日",
  "routine.noRoutine": "ルーティンなし",
  "routine.repeatSettings": "繰り返しルーティン設定",
  "routine.repeatDesc": "ここで登録すると毎週その曜日に自動でルーティンが追加されます。",
  "routine.addRepeat": "繰り返し追加",
  "routine.noRepeat": "登録された繰り返しルーティンがありません。",
  "routine.weeklyLabel": "毎週{day}曜日",

  "calendar.title": "カレンダー",
  "calendar.subtitle": "今月のルーティンを一目で確認・編集しましょう。",
  "calendar.today": "今日",
  "calendar.monthLabel": "{year}年{month}月",
  "calendar.legendDone": "完了",
  "calendar.legendPartial": "進行中",
  "calendar.legendEmpty": "ルーティンなし",
  "calendar.legendWeight": "体重記録あり",
  "calendar.selectDayPrompt": "日付を選択するとその日のルーティンが見られます。",
  "calendar.addForDay": "この日にルーティン追加",

  "exercises.title": "種目図鑑",
  "exercises.subtitle": "部位別に種目を確認できます。",
  "exercises.noImage": "画像なし",

  "stats.title": "統計",
  "stats.subtitle": "体重と種目別の重量変化を確認しましょう。",
  "stats.bigThree": "ビッグ3自己ベスト",
  "stats.bigThreeTotal": "ビッグ3合計",
  "stats.bodyPartShare": "部位別トレーニング比率(直近30日)",
  "stats.weightChange": "体重の変化",
  "stats.exerciseWeightChange": "種目別重量変化",
  "stats.sessionMaxWeight": "セッション別最高重量",
  "stats.totalVolume": "総ボリューム(重量×回数の合計)",
  "bigThree.benchPress": "ベンチプレス",
  "bigThree.deadlift": "デッドリフト",
  "bigThree.squat": "スクワット",

  "session.completeTitle": "今日のルーティン完了!",
  "session.summary": "運動{count}種目・セット{sets}個・総ボリューム{volume}kg",
  "session.skip": "スキップ",
  "session.completeNext": "完了して次へ",
  "session.suggestion": "前回のベスト {weight}kg",
  "session.newRecord": "自己ベスト達成!",

  "stats.recoveryTitle": "部位別回復状態",
  "recovery.resting": "回復中",
  "recovery.ready": "準備完了",
  "recovery.noRecord": "記録なし",
  "recovery.daysAgo": "{n}日前",
  "recovery.today": "今日",

  "auth.email": "メールアドレス",
  "auth.password": "パスワード",
  "auth.loginTitle": "PeakFitログイン",
  "auth.loginSubtitle": "トレーニングルーティンを続けて記録しましょう。",
  "auth.loggingIn": "ログイン中...",
  "auth.login": "ログイン",
  "auth.noAccount": "アカウントをお持ちでないですか?",
  "auth.signup": "新規登録",
  "auth.loginFailed": "ログインに失敗しました。",
  "auth.signupTitle": "PeakFit新規登録",
  "auth.lastName": "姓",
  "auth.firstName": "名",
  "auth.confirmPassword": "パスワード確認",
  "auth.birthDate": "生年月日",
  "auth.nationality": "国籍",
  "auth.signingUp": "登録中...",
  "auth.hasAccount": "すでにアカウントをお持ちですか?",
  "auth.passwordMismatch": "パスワードが一致しません。",
  "auth.signupFailed": "登録に失敗しました。",

  "bodyPart.CHEST": "胸",
  "bodyPart.BACK": "背中",
  "bodyPart.SHOULDER": "肩",
  "bodyPart.LEG": "下半身",
  "bodyPart.ARM_ABS": "腕+腹筋",
  "bodyPart.CARDIO": "有酸素",

  "weekday.MON": "月",
  "weekday.TUE": "火",
  "weekday.WED": "水",
  "weekday.THU": "木",
  "weekday.FRI": "金",
  "weekday.SAT": "土",
  "weekday.SUN": "日",
  "weekday.suffix": "曜日",

  "nationality.KR": "韓国",
  "nationality.JP": "日本",
  "nationality.US": "アメリカ",
  "nationality.CN": "中国",
} as const;

export type Key = keyof typeof ja;

// ko에 키가 하나라도 빠지거나 여분이 있으면 여기서 타입 에러가 남
const ko: Record<Key, string> = {
  "nav.dashboard": "대시보드",
  "nav.routine": "루틴",
  "nav.calendar": "캘린더",
  "nav.exercises": "운동 도감",
  "nav.stats": "통계",
  "nav.team": "팀",
  "nav.settings": "설정",
  "nav.help": "도움말",
  "nav.logout": "로그아웃",
  "nav.menu": "메뉴",
  "nav.general": "일반",
  "nav.tipOfDay": "오늘의 팁",

  "tip.1": "운동 전 5분 스트레칭으로 부상을 예방하세요.",
  "tip.2": "운동 후 30분 이내 단백질을 섭취하면 회복이 빨라져요.",
  "tip.3": "물은 운동 중에도 조금씩 자주 마시는 게 좋아요.",
  "tip.4": "같은 부위는 48시간 정도 쉬어야 근육이 회복돼요.",
  "tip.5": "무게보다 정확한 자세가 부상 예방에 더 중요해요.",
  "tip.6": "숙면은 근성장에 운동만큼 중요해요.",
  "tip.7": "웜업 세트로 시작하면 본세트에서 부상 위험이 줄어요.",
  "tip.8": "호흡은 힘을 줄 때 내쉬는 게 기본이에요.",
  "tip.9": "루틴은 꾸준함이 강도보다 중요해요.",
  "tip.10": "가벼운 유산소로 시작하면 관절 부담이 줄어요.",

  "common.add": "추가",
  "common.record": "기록",
  "common.selectExercise": "운동 선택",
  "common.noSetsYet": "아직 기록된 세트가 없어요.",
  "common.weightKgPlaceholder": "무게(kg)",
  "common.repsPlaceholder": "횟수",
  "common.repUnit": "회",
  "common.addSet": "세트 추가",
  "common.setCount": "{n}세트",
  "common.setLine": "{n}세트 — {weight}kg x {reps}회",
  "common.confirm": "확인",
  "common.checking": "확인 중...",
  "common.routine": "루틴",
  "common.logoAlt": "PeakFit 로고",
  "common.noData": "아직 데이터가 없어요.",

  "dashboard.searchPlaceholder": "운동 또는 루틴 검색",
  "dashboard.greetingSuffix": "님",
  "dashboard.kicker": "오늘도 화이팅",
  "dashboard.heroTitle": "한계를 넘어설 시간이에요",
  "dashboard.streakSuffix": "일 연속 달성 중",
  "dashboard.addRoutine": "루틴 추가",
  "dashboard.inviteMember": "팀원 초대",
  "dashboard.weeklyRecord": "이번 주 운동 기록",
  "dashboard.weeklyGoalRate": "이번 주 달성률",
  "dashboard.weeklyGoalHint": "목표까지 얼마 안 남았어요",
  "dashboard.todayDone": "오늘 완료",
  "dashboard.almostThere": "조금만 더!",
  "dashboard.todayReminder": "오늘의 리마인더",
  "dashboard.remainingRoutines": "오늘 남은 루틴 {n}개",
  "dashboard.startRoutine": "루틴 시작하기",
  "dashboard.noRoutinesToday": "오늘 등록된 루틴이 없어요.",
  "dashboard.allDoneToday": "오늘 루틴을 모두 완료했어요!",
  "dashboard.todayRoutines": "오늘의 루틴",
  "dashboard.teamCollab": "팀 콜라보레이션",
  "dashboard.addMember": "멤버 추가",
  "dashboard.status.done": "완료",
  "dashboard.status.inProgress": "진행중",
  "dashboard.status.notDone": "미완료",
  "dashboard.weeklyGoalDonut": "주간 목표 달성률",
  "dashboard.vsGoal": "목표 대비",
  "dashboard.achieved": "달성",
  "dashboard.remaining": "남음",
  "dashboard.streakTitle": "연속 달성일",
  "dashboard.streakDaySuffix": "일째",
  "dashboard.streakHint": "이 페이스를 유지하면 이번 달 최고 기록이에요.",
  "dashboard.bodyWeightRecord": "몸무게 기록",
  "dashboard.noRecord": "기록 없음",
  "dashboard.todayWeightPlaceholder": "오늘 몸무게(kg)",

  "routine.title": "루틴 관리",
  "routine.subtitle": "이번 주 루틴을 그때그때 추가하거나, 매주 반복되는 루틴을 설정해두세요.",
  "routine.thisWeek": "이번 주 루틴",
  "routine.todaySuffix": " · 오늘",
  "routine.noRoutine": "루틴 없음",
  "routine.repeatSettings": "반복 루틴 설정",
  "routine.repeatDesc": "여기서 등록하면 매주 그 요일에 자동으로 루틴이 채워져요.",
  "routine.addRepeat": "반복 추가",
  "routine.noRepeat": "등록된 반복 루틴이 없어요.",
  "routine.weeklyLabel": "매주 {day}요일",

  "calendar.title": "캘린더",
  "calendar.subtitle": "이 달의 루틴을 한눈에 확인하고 편집하세요.",
  "calendar.today": "오늘",
  "calendar.monthLabel": "{year}년 {month}월",
  "calendar.legendDone": "완료",
  "calendar.legendPartial": "진행중",
  "calendar.legendEmpty": "루틴 없음",
  "calendar.legendWeight": "몸무게 기록",
  "calendar.selectDayPrompt": "날짜를 선택하면 그날의 루틴을 볼 수 있어요.",
  "calendar.addForDay": "이 날짜에 루틴 추가",

  "exercises.title": "운동 도감",
  "exercises.subtitle": "부위별로 운동 종목을 확인할 수 있어요.",
  "exercises.noImage": "이미지 없음",

  "stats.title": "통계",
  "stats.subtitle": "몸무게와 운동별 무게 변화를 확인하세요.",
  "stats.bigThree": "3대 운동 최고 기록",
  "stats.bigThreeTotal": "3대 합계",
  "stats.bodyPartShare": "부위별 운동 비중 (최근 30일)",
  "stats.weightChange": "몸무게 변화",
  "stats.exerciseWeightChange": "운동별 무게 변화",
  "stats.sessionMaxWeight": "세션별 최고 무게",
  "stats.totalVolume": "총 볼륨 (무게 x 횟수 합)",
  "bigThree.benchPress": "벤치프레스",
  "bigThree.deadlift": "데드리프트",
  "bigThree.squat": "스쿼트",

  "session.completeTitle": "오늘 루틴 완료!",
  "session.summary": "운동 {count}개 · 세트 {sets}개 · 총 볼륨 {volume}kg",
  "session.skip": "건너뛰기",
  "session.completeNext": "완료하고 다음",
  "session.suggestion": "지난번 최고 {weight}kg",
  "session.newRecord": "신기록 달성!",

  "stats.recoveryTitle": "부위별 회복 상태",
  "recovery.resting": "회복중",
  "recovery.ready": "준비완료",
  "recovery.noRecord": "기록 없음",
  "recovery.daysAgo": "{n}일 전",
  "recovery.today": "오늘",

  "auth.email": "이메일",
  "auth.password": "비밀번호",
  "auth.loginTitle": "PeakFit 로그인",
  "auth.loginSubtitle": "운동 루틴을 이어서 기록해보세요.",
  "auth.loggingIn": "로그인 중...",
  "auth.login": "로그인",
  "auth.noAccount": "계정이 없나요?",
  "auth.signup": "회원가입",
  "auth.loginFailed": "로그인에 실패했습니다.",
  "auth.signupTitle": "PeakFit 회원가입",
  "auth.lastName": "성",
  "auth.firstName": "이름",
  "auth.confirmPassword": "비밀번호 확인",
  "auth.birthDate": "생년월일",
  "auth.nationality": "국적",
  "auth.signingUp": "가입 중...",
  "auth.hasAccount": "이미 계정이 있나요?",
  "auth.passwordMismatch": "비밀번호가 일치하지 않습니다.",
  "auth.signupFailed": "회원가입에 실패했습니다.",

  "bodyPart.CHEST": "가슴",
  "bodyPart.BACK": "등",
  "bodyPart.SHOULDER": "어깨",
  "bodyPart.LEG": "하체",
  "bodyPart.ARM_ABS": "팔+복근",
  "bodyPart.CARDIO": "유산소",

  "weekday.MON": "월",
  "weekday.TUE": "화",
  "weekday.WED": "수",
  "weekday.THU": "목",
  "weekday.FRI": "금",
  "weekday.SAT": "토",
  "weekday.SUN": "일",
  "weekday.suffix": "요일",

  "nationality.KR": "대한민국",
  "nationality.JP": "일본",
  "nationality.US": "미국",
  "nationality.CN": "중국",
};

const dictionaries: Record<Locale, Record<Key, string>> = { ja, ko };

export type TFunction = (key: Key, vars?: Record<string, string | number>) => string;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

// 기본값은 일본어. localStorage에 저장된 값이 있으면 그걸 우선 사용
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ja");

  useEffect(() => {
    const saved = localStorage.getItem("locale");
    if (saved === "ko" || saved === "ja") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    localStorage.setItem("locale", next);
    setLocaleState(next);
  }

  const t: TFunction = (key, vars) => {
    let str: string = dictionaries[locale][key];
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage는 LanguageProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}

// 부위 코드(CHEST 등)를 현재 언어의 라벨로 변환
export function bodyPartLabel(code: string, t: TFunction): string {
  return t(`bodyPart.${code}` as Key);
}

const WEEKDAY_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

// 월요일 시작 7개 요일 라벨(요일/曜日 접미사 제외한 짧은 형태)
export function weekdayLabels(t: TFunction): string[] {
  return WEEKDAY_CODES.map((c) => t(`weekday.${c}` as Key));
}
