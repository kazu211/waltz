# 共有型定義 開発指示

## 対象ディレクトリ

`shared/` 配下の共有型定義ファイル。

## 役割

`shared/types.ts` はバックエンド（GAS）とフロントエンド（React）の間で共有される型定義のソースファイルです。

## 重要なルール

- 型の追加・変更は必ず `shared/types.ts` で行うこと
- `api/src/types.ts` は `shared/types.ts` からコピーされる生成ファイルのため、直接編集しないこと（`.gitignore` で除外済み）
- コピー処理: `npm run api:copy-types`（`api:push` 実行時にも自動で呼ばれる）

## GAS 互換性の注意

- `import` / `export` 構文は使用不可（GAS が ES Modules に非対応のため）
- 型定義はすべてグローバルスコープで宣言する（`type`, `interface` のみ）
- `enum` は使用可能だが、GAS 上では値としてコンパイルされるため注意
- Node.js 固有の型（`Buffer`, `Promise` 等）は使用しないこと

## 現在の型定義

- `TransactionType`: 収支タイプ（`income` / `expense`）
- `KakeiboRecord`: 家計簿レコード
- `CreateRequest` / `UpdateRequest` / `DeleteRequest` / `ListRequest`: API リクエスト型
- `ApiResponse<T>`: API レスポンス型
- `ActionType`: アクション種別
