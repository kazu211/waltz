# Waltz API

Google Apps Script (GAS) による家計簿バックエンド API。Google スプレッドシートをデータベースとして使用します。

## API 仕様

API 仕様は OpenAPI 3.0 形式で記述しています。

📄 **[openapi.yaml](./openapi.yaml)**

> [Swagger Editor](https://editor.swagger.io/) にファイルの内容を貼り付けると、インタラクティブなドキュメントとして閲覧できます。

## 共通仕様

| 項目 | 内容 |
|---|---|
| HTTP メソッド | POST |
| ルーティング | クエリパラメータ `action` で操作を切り分け |
| リクエスト body | JSON |
| 認証 | body に `authId` / `authPassword` を含める |
| URL | `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action={ACTION}` |

### レスポンス形式

```json
// 成功
{ "success": true, "data": ... }

// エラー
{ "success": false, "error": "エラーメッセージ" }
```

## アクション一覧

| アクション | 説明 | タグ |
|---|---|---|
| `create` | 家計簿レコード新規作成 | 家計簿 |
| `update` | 家計簿レコード更新 | 家計簿 |
| `delete` | 家計簿レコード削除 | 家計簿 |
| `list` | 家計簿レコード一覧取得 | 家計簿 |
| `categoryList` | カテゴリ一覧取得（読み取り専用） | カテゴリ |
| `summary` | 月次サマリー | 集計 |
| `summaryByCategory` | カテゴリ別集計 | 集計 |
| `monthlyTrend` | 月次推移（年間） | 集計 |
| `memberList` | メンバー一覧取得（読み取り専用） | メンバー |

## データ構造

### シート: 家計簿

| 列 | フィールド | 型 | 必須 | 説明 |
|---|---|---|---|---|
| A | id | string | ✅ | UUID（自動生成） |
| B | date | string | ✅ | 日付（yyyy-MM-dd） |
| C | type | string | ✅ | `income`（収入）/ `expense`（支出） |
| D | parentCategory | string | ✅ | 親カテゴリ（例: 食費、交通費） |
| E | childCategory | string | - | 子カテゴリ（例: 外食、電車） |
| F | storeName | string | - | 店名 |
| G | persons | string | - | 使用者（カンマ区切り。例: `太郎,花子`） |
| H | amount | number | ✅ | 金額（0以上） |
| I | memo | string | - | メモ |

### シート: カテゴリ

| 列 | フィールド | 説明 |
|---|---|---|
| A | id | UUID（任意の一意な文字列） |
| B | type | `income`（収入）/ `expense`（支出） |
| C | parentCategory | 親カテゴリ名 |
| D | childCategory | 子カテゴリ名（空欄可） |

> カテゴリの追加・編集・削除はスプレッドシート上で直接行ってください。

### シート: メンバー

| 列 | フィールド | 説明 |
|---|---|---|
| A | id | UUID（任意の一意な文字列） |
| B | name | メンバー名 |

> メンバーの追加・削除はスプレッドシート上で直接行ってください。

## 認証

すべての API リクエストの body に `authId` / `authPassword` フィールドを含めてください。

| レスポンス | 条件 |
|---|---|
| 正常処理 | `authId` / `authPassword` が正しい |
| 正常処理 | Script Properties に認証情報が未設定（認証スキップ） |
| エラー | 認証情報が設定済みだがリクエストに未指定 |
| エラー | 認証情報が不一致 |

認証情報の設定方法はルートの [README.md](../README.md) を参照してください。

## 開発

### npm scripts（プロジェクトルートから実行）

| コマンド | 用途 |
|---|---|
| `npm run api:push` | 共有型定義のコピー + GAS にプッシュ |
| `npm run api:deploy` | コードプッシュ + デプロイ（Deployment ID 自動取得） |
| `npm run api:deployments` | デプロイ一覧を表示 |
| `npm run api:open` | GAS エディタを開く |
| `npm run api:logs` | GAS ログを表示 |

> ⚠️ `api/` 内で `npx clasp` を直接実行しないでください。必ずルートから `npm run api:*` を使用してください。

### デプロイ方式

**Deployment ID 固定方式**を採用しています。`scripts/deploy.js` が `clasp deployments` から最新の Deployment ID を自動取得し、同じ ID で再デプロイするため API の URL が変わりません。

- 初回: 新規デプロイを作成
- 以降: 既存の Deployment ID で再デプロイ（URL 不変）

## curl リクエスト例

以下の変数を環境に合わせて設定してから実行してください。

```bash
BASE_URL="https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec"
AUTH_ID="your-id"
AUTH_PASSWORD="your-password"
```

> 認証情報を設定していない場合は、body から `authId` / `authPassword` を省略できます。

### 一覧取得

```bash
curl -L -X POST "${BASE_URL}?action=list" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\"}"
```

### 一覧取得（期間指定）

```bash
curl -L -X POST "${BASE_URL}?action=list" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"startDate\": \"2026-03-01\", \"endDate\": \"2026-03-31\"}"
```

### 新規作成

```bash
curl -L -X POST "${BASE_URL}?action=create" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"date\": \"2026-03-11\", \"type\": \"expense\", \"parentCategory\": \"食費\", \"childCategory\": \"外食\", \"storeName\": \"レストランA\", \"persons\": [\"太郎\", \"花子\"], \"amount\": 3000, \"memo\": \"ランチ\"}"
```

### 更新

```bash
curl -L -X POST "${BASE_URL}?action=update" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"id\": \"<RECORD_ID>\", \"amount\": 3500, \"memo\": \"ランチ（修正）\"}"
```

### 削除

```bash
curl -L -X POST "${BASE_URL}?action=delete" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"id\": \"<RECORD_ID>\"}"
```

### カテゴリ一覧

```bash
curl -L -X POST "${BASE_URL}?action=categoryList" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\"}"
```

### 月次サマリー

```bash
curl -L -X POST "${BASE_URL}?action=summary" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"year\": 2026, \"month\": 3}"
```

### カテゴリ別集計

```bash
curl -L -X POST "${BASE_URL}?action=summaryByCategory" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"year\": 2026, \"month\": 3, \"type\": \"expense\"}"
```

### 月次推移（年間）

```bash
curl -L -X POST "${BASE_URL}?action=monthlyTrend" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"year\": 2026}"
```

### メンバー一覧

```bash
curl -L -X POST "${BASE_URL}?action=memberList" \
  -H "Content-Type: text/plain" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\"}"
```
