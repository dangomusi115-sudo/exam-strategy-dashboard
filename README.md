# Exam Strategy Dashboard v2

大学受験の過去問・模試成績を記録し、目標点・合格基準との差・成長推移・弱点を確認する React/TypeScript アプリです。

## 主な機能
- 過去問の年度別・大学別記録
- 科目別得点と総合点の自動集計
- 合格基準・目標点との差の表示
- 模試記録と判定管理
- 成績推移・弱点分析
- 目標得点シミュレーター / 逆算
- 共通テストと二次試験の換算計算
- JSONバックアップ / 復元
- Google Sheets連携（Firebase/Google設定が必要）

## 起動
```bash
npm install
npm run dev
```

## ビルド
```bash
npm run build
```

## 注意
大学の配点・合格最低点は年度ごとに変更される可能性があります。`src/data/universities.ts` の数値は、実際に利用する年度の公式募集要項・入試結果で必ず確認してください。

## データ保存
基本データはブラウザの localStorage に保存されます。端末間同期には Google Sheets 連携等を利用してください。
