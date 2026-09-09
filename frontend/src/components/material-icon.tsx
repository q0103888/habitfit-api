// lucide-react 대신 Stitch 디자인에서 쓴 Material Symbols 아이콘을 쓰기 위한 작은 래퍼.
// 아이콘 이름을 텍스트(리거처)로 넣으면 폰트가 알아서 아이콘 모양으로 그려줌
export function MaterialIcon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined select-none ${className}`}>{name}</span>;
}
