# Waltz - 家計簿Webアプリケーション

家計の収支を記録・管理するWebアプリケーション。PC・スマートフォンのブラウザから利用可能。

## 技術スタック

| 区分 | 技術 |
|---|---|
| バックエンド | Google Apps Script (TypeScript) |
| フロントエンド | React + Vite + TypeScript + Tailwind CSS（Phase 4以降） |
| データベース | Google スプレッドシート |
| ホスティング（API） | GAS Web App |
| ホスティング（フロント） | GitHub Pages |
| デプロイ | clasp + GitHub Actions |
| リポジトリ構成 | モノレポ |

## ディレクトリ構成

```
waltz/
├── api/                    ← GASバックエンド
│   ├── src/
│   │   ├── main.ts         ← APIメインコード
│   │   └── appsscript.json ← GASプロジェクト設定
│   ├── scripts/
│   │   └── deploy.js       ← デプロイスクリプト
│   ├── tsconfig.json
│   └── .clasp.json.example ← clasp設定テンプレート
├── app/                    ← Reactフロントエンド（Phase 4以降）
├── shared/                 ← 共有型定義
│   └── types.ts
├── .github/
│   └── workflows/
│       └── deploy-api.yml  ← GAS自動デプロイ
├── package.json
├── .gitignore
└── README.md
```

---

## 画面構成

| # | 画面 | 説明 |
|---|---|---|
| 1 | ログイン画面 | 認証（Phase 3のAuth APIを使用） |
| 2 | ダッシュボード | 今月の収支サマリー、前月比 |
| 3 | 月次一覧画面 | 月ごとの収支データ一覧。データの追加・編集・削除が可能 |
| 4 | 月次収支グラフ画面 | カテゴリ別の円グラフ、収入/支出の棒グラフなど |
| 5 | 年次推移画面 | 12ヶ月の月次収支推移（折れ線グラフ等） |
| 6 | 設定画面 | メンバー管理、表示設定など |

---

## フェーズ計画

### Phase 1: 基本CRUD（バックエンド）✅

- 家計簿データの新規作成・編集・削除・一覧取得
- バリデーション
- clasp プロジェクト構成
- GitHub Actions による自動デプロイ
- ドキュメント整備

### Phase 2: カテゴリ管理 + 集計（バックエンド）✅

- **カテゴリマスタ**
  - 別シート「カテゴリ」で親カテゴリ・子カテゴリを管理（スプレッドシートで直接編集）
  - `action=categoryList` で一覧取得（読み取り専用）
- **集計API**
  - `action=summary` → 指定月の収入合計・支出合計・差額
  - `action=summaryByCategory` → カテゴリ別集計（円グラフ用）
  - `action=monthlyTrend` → 月次推移（年間の月別合計、折れ線グラフ用）

### Phase 3: 認証 + メンバー管理（バックエンド）✅

- **API Key 認証**
  - リクエスト body の `apiKey` フィールドで認証
  - GAS の Script Properties に `API_KEY` を設定
  - `API_KEY` 未設定時は認証スキップ（初期セットアップ用）
- **メンバー管理**
  - 別シート「メンバー」で管理（スプレッドシートで直接編集）
  - `action=memberList` で一覧取得（読み取り専用）

### Phase 4: フロントエンド基盤 + ログイン

- React + Vite + TypeScript プロジェクトセットアップ
- Tailwind CSS 導入
- ログイン画面
- 共通レイアウト（ナビゲーション）
- GitHub Pages デプロイ設定

### Phase 5: フロントエンド - メイン画面

- 月次一覧画面（データの参照・追加・編集・削除）
- ダッシュボード画面（今月のサマリー）

### Phase 6: フロントエンド - グラフ・管理画面

- 月次収支グラフ画面（Recharts / Chart.js）
- 年次推移画面
- 設定画面

---

## データ構造

### シート: 家計簿（手動作成）

スプレッドシートで「家計簿」シートを作成し、1行目に以下のヘッダーを設定してください。

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

### シート: カテゴリ（手動作成）

スプレッドシートで「カテゴリ」シートを作成し、以下のヘッダー行を設定してください。データの追加・編集・削除はスプレッドシート上で直接行います。

| 列 | フィールド | 説明 |
|---|---|---|
| A | id | UUID（任意の一意な文字列） |
| B | parentCategory | 親カテゴリ名（例: 食費、交通費） |
| C | childCategory | 子カテゴリ名（例: 外食、電車。空欄可） |

### シート: メンバー（手動作成）

スプレッドシートで「メンバー」シートを作成し、以下のヘッダー行を設定してください。データの追加・削除はスプレッドシート上で直接行います。

| 列 | フィールド | 説明 |
|---|---|---|
| A | id | UUID（任意の一意な文字列） |
| B | name | メンバー名 |

---

## API仕様

### 共通

- **HTTPメソッド**: POST
- **ルーティング**: クエリパラメータ `action` で操作を切り分け
- **データ**: リクエストbodyにJSON
- **認証**: リクエストbodyに `apiKey` フィールドを含める（全アクション共通）
- **URL**: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action={ACTION}`

> `API_KEY` が Script Properties に未設定の場合、認証はスキップされます。設定方法は[API Key の設定](#api-key-の設定)を参照してください。

### レスポンス形式

```json
// 成功
{ "success": true, "data": ... }

// エラー
{ "success": false, "error": "エラーメッセージ" }
```

### Phase 1: 家計簿データ操作

#### `action=create` - 新規作成

**リクエストbody:**
```json
{
  "date": "2026-03-04",
  "type": "expense",
  "parentCategory": "食費",
  "childCategory": "外食",
  "storeName": "レストランA",
  "persons": ["太郎", "花子"],
  "amount": 3000,
  "memo": "ランチ"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "date": "2026-03-04",
    "type": "expense",
    "parentCategory": "食費",
    "childCategory": "外食",
    "storeName": "レストランA",
    "persons": ["太郎", "花子"],
    "amount": 3000,
    "memo": "ランチ"
  }
}
```

#### `action=update` - 編集

**リクエストbody（変更したいフィールドのみ指定可）:**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "amount": 3500,
  "memo": "ランチ（修正）"
}
```

**レスポンス:** 更新後のレコード全体を返却

#### `action=delete` - 削除

**リクエストbody:**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": { "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
}
```

#### `action=list` - 一覧取得

**リクエストbody（期間指定はオプション）:**
```json
{
  "startDate": "2026-03-01",
  "endDate": "2026-03-31"
}
```

省略時は全件取得。日付の降順でソートされます。

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "date": "2026-03-04",
      "type": "expense",
      "parentCategory": "食費",
      "childCategory": "外食",
      "storeName": "レストランA",
      "persons": ["太郎", "花子"],
      "amount": 3000,
      "memo": "ランチ"
    }
  ]
}
```

### Phase 2: カテゴリ管理 + 集計

#### `action=categoryList` - カテゴリ一覧取得

**リクエストbody:** なし（空オブジェクト `{}` を送信）

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "parentCategory": "食費",
      "childCategory": "外食"
    },
    {
      "id": "...",
      "parentCategory": "食費",
      "childCategory": "自炊"
    }
  ]
}
```

> カテゴリの追加・編集・削除はスプレッドシートの「カテゴリ」シートで直接行ってください。シートが存在しない場合は空配列が返ります。

#### `action=summary` - 月次サマリー

**リクエストbody:**
```json
{
  "year": 2026,
  "month": 3
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "month": 3,
    "income": 300000,
    "expense": 180000,
    "balance": 120000
  }
}
```

#### `action=summaryByCategory` - カテゴリ別集計

**リクエストbody:**
```json
{
  "year": 2026,
  "month": 3,
  "type": "expense"
}
```

`type` は省略可（デフォルト: `expense`）。

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "month": 3,
    "type": "expense",
    "categories": [
      { "parentCategory": "食費", "childCategory": "外食", "amount": 30000 },
      { "parentCategory": "交通費", "childCategory": "電車", "amount": 15000 }
    ]
  }
}
```

カテゴリは金額の降順でソートされます。

#### `action=monthlyTrend` - 月次推移（年間）

**リクエストbody:**
```json
{
  "year": 2026
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "months": [
      { "month": 1, "income": 300000, "expense": 200000, "balance": 100000 },
      { "month": 2, "income": 300000, "expense": 180000, "balance": 120000 },
      ...
    ]
  }
}
```

12ヶ月分のデータが返ります。データがない月は income/expense/balance すべて 0 になります。

### Phase 3: 認証 + メンバー管理

#### 認証

すべての API リクエストの body に `apiKey` フィールドを含めてください。

```json
{
  "apiKey": "your-api-key-here",
  "date": "2026-03-04",
  ...
}
```

| レスポンス | 条件 |
|---|---|
| 正常処理 | `apiKey` が Script Properties の `API_KEY` と一致 |
| 正常処理 | Script Properties に `API_KEY` が未設定（認証スキップ） |
| `認証エラー: apiKey が指定されていません` | `API_KEY` が設定済みだが `apiKey` が未指定 |
| `認証エラー: apiKey が正しくありません` | `apiKey` が不一致 |

#### `action=memberList` - メンバー一覧取得

**リクエストbody:**
```json
{
  "apiKey": "your-api-key-here"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "太郎" },
    { "id": "2", "name": "花子" }
  ]
}
```

> メンバーの追加・削除はスプレッドシートの「メンバー」シートで直接行ってください。シートが存在しない場合は空配列が返ります。

---

## 初期セットアップ手順

### 前提条件

- Node.js 20以上
- npm
- Google アカウント

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd waltz
npm install
```

### 2. clasp ログイン

```bash
npm run api:login
```

ブラウザが開くのでGoogleアカウントでログインする。

### 3. Google スプレッドシートの作成

1. [Google Drive](https://drive.google.com/) で新しい Google スプレッドシートを作成する
2. スプレッドシート名を「Waltz」に設定する

### 4. GAS プロジェクト作成

1. 作成したスプレッドシートを開き、メニューの「拡張機能」→「Apps Script」を選択する
2. GAS エディタが開いたら、左メニューの「プロジェクトの設定」（⚙）を選択する
3. 「スクリプト ID」をコピーする
4. プロジェクトの `api/.clasp.json.example` をコピーして `api/.clasp.json` を作成し、Script ID を設定する

   ```bash
   cd api
   cp .clasp.json.example .clasp.json
   ```

   ```json
   {
     "scriptId": "コピーしたスクリプトID",
     "rootDir": "src"
   }
   ```

### 5. シートの作成

スプレッドシートに以下のシートを手動で作成し、1行目にヘッダーを設定する。各シートの詳細は[データ構造](#データ構造)を参照。

| シート名 | ヘッダー（1行目） | 備考 |
|---|---|---|
| 家計簿 | `id` `date` `type` `parentCategory` `childCategory` `storeName` `persons` `amount` `memo` | 必須 |
| カテゴリ | `id` `parentCategory` `childCategory` | 任意（カテゴリ一覧APIを使う場合） |
| メンバー | `id` `name` | 任意（メンバー一覧APIを使う場合） |

### 6. 初回デプロイ

プロジェクトルートに戻り、以下のコマンドを実行する：

```bash
cd ..

# GAS にコードをプッシュ + Web アプリとしてデプロイ
npm run api:deploy
```

初回は新規デプロイが作成され、2回目以降は同じ Deployment ID で再デプロイされる（URL が変わらない）。

Deployment ID は以下のコマンドで確認できる：

```bash
npm run api:deployments
```

### 7. 動作確認

`npm run api:deployments` で確認した Deployment ID を使い、以下のコマンドで動作を確認する：

```bash
curl -L -X POST "https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?action=list" \
  -H "Content-Type: application/json" \
  -d '{}'
```

正常に動作していれば以下のレスポンスが返る：

```json
{"success":true,"data":[]}
```

### 8. API Key の設定

API を外部からのアクセスから保護するために API Key を設定する。

1. GAS エディタを開く（`npm run api:open`）
2. 左メニューの「プロジェクトの設定」（⚙）を選択
3. 「スクリプト プロパティ」セクションで以下を追加：

| プロパティ | 値 |
|---|---|
| `API_KEY` | 任意の文字列（推奨: 32文字以上のランダム文字列） |

設定後、すべての API リクエストの body に `"apiKey": "設定した値"` を含める必要がある。

> `API_KEY` を設定しない場合、認証なしで API にアクセスできます。開発中は未設定のまま動作確認し、運用開始時に設定することを推奨します。

---

## GitHub Actions によるデプロイ

### 必要なシークレット

リポジトリの Settings > Secrets and variables > Actions に以下を設定：

| シークレット名 | 値 |
|---|---|
| `CLASPRC_JSON` | `~/.clasprc.json` の内容（clasp login後に生成される認証情報） |
| `GAS_SCRIPT_ID` | GASプロジェクトの Script ID |

### `CLASPRC_JSON` の取得方法

```bash
# macOS / Linux
cat ~/.clasprc.json

# Windows
type %USERPROFILE%\.clasprc.json
```

### デプロイトリガー

- `main` ブランチへのプッシュ時、`api/` または `shared/` 配下のファイルが変更された場合に自動デプロイ
- 手動実行（workflow_dispatch）も可能

---

## デプロイ方式

**Deployment ID 固定方式**を採用。`scripts/deploy.js` が `clasp deployments` から最新の Deployment ID を自動取得し、同じ ID で再デプロイすることで API の URL が変わらない。

- API URL: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`
- 初回: 新規デプロイを作成
- 以降: 既存の Deployment ID で再デプロイ（URL 不変）
- コマンド: `npm run api:deploy`（初回・以降を自動判定）

---

## 注意事項

### CORS

GitHub Pages（`*.github.io`）から GAS（`script.google.com`）への通信はクロスオリジンになります。GAS側で `ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON)` を使用すれば基本的にCORSは通りますが、GASはリダイレクト(302)を挟むため、フロントエンドの `fetch` で `redirect: 'follow'` を設定してください。

### GASのレスポンス速度

GASは初回実行（コールドスタート）で数秒かかることがあります。フロントエンドではローディング表示を入れ、`localStorage` でキャッシュを活用することを推奨します。

### GitHub Pages の SPA 対応

GitHub Pagesはサーバーサイドルーティングをサポートしないため、以下のいずれかで対応：
- `404.html` を `index.html` と同じ内容にする
- HashRouter を使用する

### PWA化（推奨）

スマートフォンから利用する場合、PWA対応するとホーム画面に追加でき、アプリのような体験になります。Viteなら `vite-plugin-pwa` で対応可能。

---

## API リクエスト例（curl）

以下の変数を環境に合わせて設定してから実行してください。

```bash
# 環境変数の設定
BASE_URL="https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec"
API_KEY="your-api-key-here"
```

> `API_KEY` を Script Properties に設定していない場合は、各コマンドの body から `"apiKey"` フィールドを省略できます。

### 家計簿データ操作

#### 一覧取得（全件）

```bash
curl -L -X POST "${BASE_URL}?action=list" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\"}"
```

#### 一覧取得（期間指定）

```bash
curl -L -X POST "${BASE_URL}?action=list" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\", \"startDate\": \"2026-03-01\", \"endDate\": \"2026-03-31\"}"
```

#### 新規作成

```bash
curl -L -X POST "${BASE_URL}?action=create" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\", \"date\": \"2026-03-11\", \"type\": \"expense\", \"parentCategory\": \"食費\", \"childCategory\": \"外食\", \"storeName\": \"レストランA\", \"persons\": [\"太郎\", \"花子\"], \"amount\": 3000, \"memo\": \"ランチ\"}"
```

#### 更新

```bash
curl -L -X POST "${BASE_URL}?action=update" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\", \"id\": \"<RECORD_ID>\", \"amount\": 3500, \"memo\": \"ランチ（修正）\"}"
```

#### 削除

```bash
curl -L -X POST "${BASE_URL}?action=delete" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\", \"id\": \"<RECORD_ID>\"}"
```

### カテゴリ

#### カテゴリ一覧取得

```bash
curl -L -X POST "${BASE_URL}?action=categoryList" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\"}"
```

### 集計

#### 月次サマリー

```bash
curl -L -X POST "${BASE_URL}?action=summary" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\", \"year\": 2026, \"month\": 3}"
```

#### カテゴリ別集計（支出）

```bash
curl -L -X POST "${BASE_URL}?action=summaryByCategory" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\", \"year\": 2026, \"month\": 3, \"type\": \"expense\"}"
```

#### カテゴリ別集計（収入）

```bash
curl -L -X POST "${BASE_URL}?action=summaryByCategory" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\", \"year\": 2026, \"month\": 3, \"type\": \"income\"}"
```

#### 月次推移（年間）

```bash
curl -L -X POST "${BASE_URL}?action=monthlyTrend" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\", \"year\": 2026}"
```

### メンバー

#### メンバー一覧取得

```bash
curl -L -X POST "${BASE_URL}?action=memberList" \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"${API_KEY}\"}"
```
