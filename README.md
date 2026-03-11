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
├── app/                    ← Reactフロントエンド
│   ├── src/
│   │   ├── components/     ← 共通コンポーネント
│   │   ├── contexts/       ← React Context（認証等）
│   │   ├── lib/            ← APIクライアント等
│   │   ├── mocks/          ← モックデータ
│   │   ├── pages/          ← ページコンポーネント
│   │   ├── App.tsx         ← ルーティング
│   │   └── main.tsx        ← エントリーポイント
│   ├── vite.config.ts
│   └── package.json
├── shared/                 ← 共有型定義
│   └── types.ts
├── .github/
│   └── workflows/
│       ├── deploy-api.yml  ← GAS自動デプロイ
│       └── deploy-app.yml  ← GitHub Pages自動デプロイ
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

- **ID + パスワード認証**
  - リクエスト body の `authId` / `authPassword` フィールドで認証
  - GAS の Script Properties に `AUTH_ID` / `AUTH_PASSWORD` を設定
  - 未設定時は認証スキップ（初期セットアップ用）
- **メンバー管理**
  - 別シート「メンバー」で管理（スプレッドシートで直接編集）
  - `action=memberList` で一覧取得（読み取り専用）

### Phase 4: フロントエンド基盤 + ログイン ✅

- React + Vite + TypeScript プロジェクトセットアップ（`app/` ディレクトリ）
- Tailwind CSS v4 導入
- ログイン画面（ID + パスワード認証）
- 共通レイアウト（レスポンシブ対応ナビゲーション）
- ダッシュボード（今月の収支サマリー + 前月比）
- モックデータによる開発モード対応
- HashRouter による GitHub Pages SPA 対応
- GitHub Pages デプロイ設定

### Phase 5: フロントエンド - メイン画面 ✅

- 月次一覧画面（データの参照・追加・編集・削除）
  - 月ナビゲーション（前月/翌月切替）
  - 月間サマリー（収入・支出・収支）
  - デスクトップ: テーブル表示 / モバイル: カード表示
  - 作成・編集モーダル（カテゴリ選択、メンバー選択対応）
  - 削除確認ダイアログ

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
| B | type | `income`（収入）/ `expense`（支出） |
| C | parentCategory | 親カテゴリ名（例: 食費、交通費） |
| D | childCategory | 子カテゴリ名（例: 外食、電車。空欄可） |

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
- **認証**: リクエストbodyに `authId` / `authPassword` フィールドを含める（全アクション共通）
- **URL**: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action={ACTION}`

> `AUTH_ID` / `AUTH_PASSWORD` が Script Properties に未設定の場合、認証はスキップされます。設定方法は[認証情報の設定](#認証情報の設定)を参照してください。

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
      "type": "expense",
      "parentCategory": "食費",
      "childCategory": "外食"
    },
    {
      "id": "...",
      "type": "expense",
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

すべての API リクエストの body に `authId` / `authPassword` フィールドを含めてください。

```json
{
  "authId": "your-id",
  "authPassword": "your-password",
  "date": "2026-03-04",
  ...
}
```

| レスポンス | 条件 |
|---|---|
| 正常処理 | `authId` / `authPassword` が Script Properties の `AUTH_ID` / `AUTH_PASSWORD` と一致 |
| 正常処理 | Script Properties に `AUTH_ID` / `AUTH_PASSWORD` が未設定（認証スキップ） |
| `認証エラー: authId / authPassword が指定されていません` | 認証情報が設定済みだが未指定 |
| `認証エラー: authId または authPassword が正しくありません` | 認証情報が不一致 |

#### `action=memberList` - メンバー一覧取得

**リクエストbody:**
```json
{
  "authId": "your-id",
  "authPassword": "your-password"
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
cd app && npm install && cd ..
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
| カテゴリ | `id` `type` `parentCategory` `childCategory` | 任意（カテゴリ一覧APIを使う場合） |
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

### 8. 認証情報の設定

API を外部からのアクセスから保護するために認証情報を設定する。

1. GAS エディタを開く（`npm run api:open`）
2. 左メニューの「プロジェクトの設定」（⚙）を選択
3. 「スクリプト プロパティ」セクションで以下を追加：

| プロパティ | 値 |
|---|---|
| `AUTH_ID` | ログイン ID（任意の文字列） |
| `AUTH_PASSWORD` | ログインパスワード（推奨: 16文字以上） |

設定後、すべての API リクエストの body に `"authId"` / `"authPassword"` を含める必要がある。

> `AUTH_ID` / `AUTH_PASSWORD` を設定しない場合、認証なしで API にアクセスできます。開発中は未設定のまま動作確認し、運用開始時に設定することを推奨します。

---

## GitHub Actions によるデプロイ

### 必要なシークレット

リポジトリの Settings > Secrets and variables > Actions に以下を設定：

| シークレット名 | 値 |
|---|---|
| `CLASPRC_JSON` | `~/.clasprc.json` の内容（clasp login後に生成される認証情報） |
| `GAS_SCRIPT_ID` | GASプロジェクトの Script ID |

### 必要な変数（Variables）

リポジトリの Settings > Secrets and variables > Actions > Variables に以下を設定：

| 変数名 | 値 |
|---|---|
| `VITE_API_URL` | GAS Web App の URL（`https://script.google.com/macros/s/.../exec`） |

### `CLASPRC_JSON` の取得方法

```bash
# macOS / Linux
cat ~/.clasprc.json

# Windows
type %USERPROFILE%\.clasprc.json
```

### デプロイトリガー

- **API**: `main` ブランチへのプッシュ時、`api/` または `shared/` 配下のファイルが変更された場合に自動デプロイ
- **フロントエンド**: `main` ブランチへのプッシュ時、`app/` または `shared/` 配下のファイルが変更された場合に GitHub Pages へ自動デプロイ
- どちらも手動実行（workflow_dispatch）が可能

> GitHub Pages のデプロイには、リポジトリの Settings > Pages で Source を「GitHub Actions」に設定する必要があります。

---

## デプロイ方式

### API（GAS）

**Deployment ID 固定方式**を採用。`scripts/deploy.js` が `clasp deployments` から最新の Deployment ID を自動取得し、同じ ID で再デプロイすることで API の URL が変わらない。

- API URL: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`
- 初回: 新規デプロイを作成
- 以降: 既存の Deployment ID で再デプロイ（URL 不変）
- コマンド: `npm run api:deploy`（初回・以降を自動判定）

### フロントエンド（GitHub Pages）

- URL: `https://<username>.github.io/waltz/`
- HashRouter を使用（`/#/monthly` 等）
- `app/dist` をデプロイ

---

## フロントエンド開発

### コマンド一覧

| コマンド | 用途 |
|---|---|
| `npm run app:dev` | 開発サーバー起動（モックデータモード） |
| `npm run app:build` | プロダクションビルド |
| `npm run app:preview` | ビルド結果のプレビュー |
| `npm run app:copy-types` | 共有型定義を app 用に変換・コピー |

### モックモード

デフォルトではモックデータで動作します（ログイン画面で ID: `demo` / パスワード: `demo` でログイン）。実際の API に接続する場合は、`app/.env.local` を作成してください：

```bash
VITE_USE_MOCK=false
VITE_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

> `VITE_API_URL` はビルド時に埋め込まれます。API URL はソースコードにコミットしないでください。

---

## 注意事項

### CORS

GitHub Pages（`*.github.io`）から GAS（`script.google.com`）への通信はクロスオリジンになります。GAS側で `ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON)` を使用すれば基本的にCORSは通りますが、GASはリダイレクト(302)を挟むため、フロントエンドの `fetch` で `redirect: 'follow'` を設定してください。

### GASのレスポンス速度

GASは初回実行（コールドスタート）で数秒かかることがあります。フロントエンドではローディング表示を入れ、`localStorage` でキャッシュを活用することを推奨します。

### GitHub Pages の SPA 対応

HashRouter を採用しているため、特別な設定なしで GitHub Pages 上で動作します。URL は `https://<username>.github.io/waltz/#/monthly` のような形式になります。

### PWA化（推奨）

スマートフォンから利用する場合、PWA対応するとホーム画面に追加でき、アプリのような体験になります。Viteなら `vite-plugin-pwa` で対応可能。

---

## API リクエスト例（curl）

以下の変数を環境に合わせて設定してから実行してください。

```bash
# 環境変数の設定
BASE_URL="https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec"
AUTH_ID="your-id"
AUTH_PASSWORD="your-password"
```

> `AUTH_ID` / `AUTH_PASSWORD` を Script Properties に設定していない場合は、各コマンドの body から `"authId"` / `"authPassword"` フィールドを省略できます。

### 家計簿データ操作

#### 一覧取得（全件）

```bash
curl -L -X POST "${BASE_URL}?action=list" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\"}"
```

#### 一覧取得（期間指定）

```bash
curl -L -X POST "${BASE_URL}?action=list" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"startDate\": \"2026-03-01\", \"endDate\": \"2026-03-31\"}"
```

#### 新規作成

```bash
curl -L -X POST "${BASE_URL}?action=create" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"date\": \"2026-03-11\", \"type\": \"expense\", \"parentCategory\": \"食費\", \"childCategory\": \"外食\", \"storeName\": \"レストランA\", \"persons\": [\"太郎\", \"花子\"], \"amount\": 3000, \"memo\": \"ランチ\"}"
```

#### 更新

```bash
curl -L -X POST "${BASE_URL}?action=update" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"id\": \"<RECORD_ID>\", \"amount\": 3500, \"memo\": \"ランチ（修正）\"}"
```

#### 削除

```bash
curl -L -X POST "${BASE_URL}?action=delete" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"id\": \"<RECORD_ID>\"}"
```

### カテゴリ

#### カテゴリ一覧取得

```bash
curl -L -X POST "${BASE_URL}?action=categoryList" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\"}"
```

### 集計

#### 月次サマリー

```bash
curl -L -X POST "${BASE_URL}?action=summary" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"year\": 2026, \"month\": 3}"
```

#### カテゴリ別集計（支出）

```bash
curl -L -X POST "${BASE_URL}?action=summaryByCategory" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"year\": 2026, \"month\": 3, \"type\": \"expense\"}"
```

#### カテゴリ別集計（収入）

```bash
curl -L -X POST "${BASE_URL}?action=summaryByCategory" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"year\": 2026, \"month\": 3, \"type\": \"income\"}"
```

#### 月次推移（年間）

```bash
curl -L -X POST "${BASE_URL}?action=monthlyTrend" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\", \"year\": 2026}"
```

### メンバー

#### メンバー一覧取得

```bash
curl -L -X POST "${BASE_URL}?action=memberList" \
  -H "Content-Type: application/json" \
  -d "{\"authId\": \"${AUTH_ID}\", \"authPassword\": \"${AUTH_PASSWORD}\"}"
```
