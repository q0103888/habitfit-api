# PeakFit

筋トレルーティンと体重を記録・管理するワークアウトトラッカーです。韓国語・日本語に対応しています。

## 主な機能

- ルーティン管理（毎週の繰り返し設定、月間カレンダー表示）
- セット記録（重量・回数）、前回のベストの参考表示、自己ベスト達成通知
- 体重記録、部位別・種目別の統計グラフ
- 部位別回復状態（48時間基準）の確認
- 韓国語 / 日本語 切り替え（デフォルトは日本語）

## 技術スタック

- **フロントエンド**: Next.js 16, TypeScript, Tailwind CSS
- **バックエンド**: Spring Boot 3.5.3, Java 21
- **DB**: PostgreSQL 16
- **認証**: JWT
- **インフラ**: Vercel（フロントエンド）/ Railway（バックエンド + DB）

## ローカル実行

```bash
# DB起動
docker compose up -d

# バックエンド
cd backend && ./mvnw spring-boot:run

# フロントエンド
cd frontend && npm install && npm run dev
```
