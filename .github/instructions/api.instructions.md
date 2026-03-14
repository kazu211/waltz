# GAS API 開発指示

## 対象ディレクトリ

`api/` 配下の Google Apps Script バックエンドコード。

## アーキテクチャ

- エントリーポイント: `api/src/main.ts` の `doPost()` 関数
- ルーティング: クエリパラメータ `action` で操作を切り分け
- データアクセス: `SpreadsheetApp.getActiveSpreadsheet()` でスプレッドシートを取得
- レスポンス: `ContentService.createTextOutput()` で JSON を返却

## GAS 固有の制約

- `import` / `export` 構文は使用不可（GAS は ES Modules 非対応）。型定義はグローバルスコープで宣言
- `api/src/types.ts` は `shared/types.ts` からコピーされる生成ファイル。型の変更は `shared/types.ts` で行うこと
- `appsscript.json` は `api/src/` に配置（clasp の `rootDir` 設定と整合）
- UUID 生成には `Utilities.getUuid()` を使用
- 外部 npm パッケージは使用不可（GAS ランタイムの制約）

## API レスポンス形式

```typescript
// 成功
{ success: true, data: ... }

// エラー
{ success: false, error: "エラーメッセージ" }
```

## シート構成

- シート名: `家計簿`
- ヘッダー行（1行目）: `id | date | type | parentCategory | childCategory | storeName | persons | amount | memo`
- データは2行目以降
- シートが存在しない場合は `initializeSpreadsheet()` 関数で作成（GAS エディタから手動実行）

## clasp 操作

- すべての clasp 操作はプロジェクトルートから `npm run api:*` を使用する
- `api/` 内で `npx clasp` を直接実行しない
- `.clasp.json` は `.gitignore` で除外済み。`api/.clasp.json.example` をコピーして作成
