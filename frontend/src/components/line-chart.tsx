"use client";

// 별도 차트 라이브러리 없이 순수 SVG로 그리는 꺾은선 그래프.
// 1 단위 = 1px로 그려서 계산이 단순하고, 점마다 위에 값 아래에 날짜를 직접 써서
// 축 범례 없이도 어느 점이 며칠/몇 kg인지 바로 알 수 있게 함.
// 점이 maxPoints보다 많으면(예: 1년치 매일 기록) 균등 간격으로 솎아내서 폭이 무한정 안 늘어나게 함
// ponytail: 구간 평균이 아니라 단순 샘플링이라 사이 값 하나가 튀면 그대로 보일 수 있음 — 필요해지면 구간 평균으로 교체
export function LineChart({
  points,
  unit = "",
  maxPoints = 24,
}: {
  points: { label: string; value: number }[];
  unit?: string;
  maxPoints?: number;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-zinc-500">아직 데이터가 없어요.</p>;
  }

  const displayPoints =
    points.length <= maxPoints
      ? points
      : Array.from(
          { length: maxPoints },
          (_, i) => points[Math.round((i * (points.length - 1)) / (maxPoints - 1))],
        );

  const width = Math.max(240, displayPoints.length * 56); // 점이 많으면 폭도 늘려서 라벨이 안 겹치게
  const height = 110;
  const topPad = 20; // 값 라벨 공간
  const bottomPad = 24; // 날짜 라벨 공간
  const sidePad = 24;
  const plotHeight = height - topPad - bottomPad;

  const values = displayPoints.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // 값이 전부 같으면 0으로 나누는 걸 피함

  const coords = displayPoints.map((p, i) => ({
    x:
      displayPoints.length === 1
        ? width / 2
        : sidePad + (i / (displayPoints.length - 1)) * (width - sidePad * 2),
    y: topPad + plotHeight - ((p.value - min) / range) * plotHeight,
    ...p,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="block">
        <path d={path} fill="none" stroke="#a3e635" strokeWidth="2" />
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="3" fill="#a3e635" />
            <text x={c.x} y={c.y - 8} textAnchor="middle" fontSize="11" fill="#e4e4e7">
              {c.value}
              {unit}
            </text>
            <text x={c.x} y={height - 6} textAnchor="middle" fontSize="10" fill="#71717a">
              {c.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
