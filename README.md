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
| 6 | カテゴリ管理画面 | 親カテゴリ・子カテゴリのCRUD |
| 7 | 設定画面 | メンバー管理、表示設定など |

---

## フェーズ計画

### Phase 1: 基本CRUD（バックエンド）✅ 今回実装

- 家計簿データの新規作成・編集・削除・一覧取得
- バリデーション
- clasp プロジェクト構成
- GitHub Actions による自動デプロイ
- ドキュメント整備

### Phase 2: カテゴリ管理 + 集計（バックエンド）

- **カテゴリマスタCRUD**
  - 別シート「カテゴリ」で親カテゴリ・子カテゴリを管理
  - `action=categoryList` / `categoryCreate` / `categoryUpdate` / `categoryDelete`
- **集計API**
  - `action=summary` → 指定月の収入合計・支出合計・差額
  - `action=summaryByCategory` → カテゴリ別集計（円グラフ用）
  - `action=monthlyTrend` → 月次推移（年間の月別合計、折れ線グラフ用）

### Phase 3: 認証 + メンバー管理（バックエンド）

- APIキー or トークンによるアクセス制御
- メンバー管理API
  - `action=memberList` / `memberCreate` / `memberDelete`

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
- カテゴリ管理画面
- 設定画面

---

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

### シート: カテゴリ（Phase 2で追加予定）

| 列 | フィールド | 説明 |
|---|---|---|
| A | id | UUID |
| B | parentCategory | 親カテゴリ名 |
| C | childCategory | 子カテゴリ名 |

### シート: メンバー（Phase 3で追加予定）

| 列 | フィールド | 説明 |
|---|---|---|
| A | id | UUID |
| B | name | メンバー名 |

---

## API仕様

### 共通

- **HTTPメソッド**: POST
- **ルーティング**: クエリパラメータ `action` で操作を切り分け
- **データ**: リクエストbodyにJSON
- **URL**: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action={ACTION}`

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

### Phase 2: カテゴリ管理 + 集計（予定）

| action | 説明 | body |
|---|---|---|
| `categoryList` | カテゴリ一覧 | なし |
| `categoryCreate` | カテゴリ作成 | `{ parentCategory, childCategory }` |
| `categoryUpdate` | カテゴリ更新 | `{ id, parentCategory?, childCategory? }` |
| `categoryDelete` | カテゴリ削除 | `{ id }` |
| `summary` | 月次サマリー | `{ year, month }` |
| `summaryByCategory` | カテゴリ別集計 | `{ year, month, type? }` |
| `monthlyTrend` | 月次推移 | `{ year }` |

### Phase 3: 認証 + メンバー管理（予定）

| action | 説明 | body |
|---|---|---|
| `memberList` | メンバー一覧 | なし |
| `memberCreate` | メンバー追加 | `{ name }` |
| `memberDelete` | メンバー削除 | `{ id }` |

※ 認証方式の詳細はPhase 3実装時に決定

---

## 初期セットアップ手順

### 前提条件

- Node.js 20以上
- npm
- Google アカウント
- clasp のグローバルインストール（`npm install -g @google/clasp`）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd waltz
npm install
```

### 2. clasp ログイン

```bash
clasp login
```

ブラウザが開くのでGoogleアカウントでログインする。

### 3. Google スプレッドシートの作成

1. [Google Drive](https://drive.google.com/) で新しい Google スプレッドシートを作成する
2. スプレッドシート名を「Waltz」など任意の名前に設定する
3. URL からスプレッドシート ID を控えておく

   ```
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
   ```

> **重要**: 本プロジェクトのコードは `SpreadsheetApp.getActiveSpreadsheet()` を使用しているため、GAS プロジェクトはスプレッドシートにバインド（コンテナバインドスクリプト）する必要があります。

### 4. GAS プロジェクト作成（コンテナバインド）

```bash
cd api
clasp create --parentId <SPREADSHEET_ID> --title "Waltz API"
```

これにより `.clasp.json` が生成され、`scriptId` が設定される。

生成された `.clasp.json` に `rootDir` を追加する：

```json
{
  "scriptId": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "rootDir": "src"
}
```

> **注意**: `--type webapp` ではなく `--parentId` を使用してください。`--type webapp` はスタンドアロンスクリプトを作成するため、`getActiveSpreadsheet()` が動作しません。

### 5. 初回デプロイ

プロジェクトルートに戻り、以下のコマンドを実行する：

```bash
cd ..

# GASにコードをプッシュ（共有型定義のコピー + clasp push）
npm run api:push

# Webアプリとしてデプロイ
cd api
clasp deploy
```

> **注意**: `api/` ディレクトリには `package.json` がないため、`api/` 内で直接 `npx clasp push` を実行するとエラーになります。必ずプロジェクトルートから `npm run api:push` を使用してください。

出力される **Deployment ID** をメモしておく。以降のデプロイではこのIDを使用する：

```bash
clasp deploy -i <DEPLOYMENT_ID>
```

### 6. スプレッドシートの確認

初回のAPIリクエスト時に「家計簿」シートとヘッダー行が自動作成されます。手動で作成する場合は以下のヘッダーを1行目に設定：

```
id | date | type | parentCategory | childCategory | storeName | persons | amount | memo
```

---

## GitHub Actions によるデプロイ

### 必要なシークレット

リポジトリの Settings > Secrets and variables > Actions に以下を設定：

| シークレット名 | 値 |
|---|---|
| `CLASPRC_JSON` | `~/.clasprc.json` の内容（clasp login後に生成される認証情報） |
| `GAS_SCRIPT_ID` | GASプロジェクトの Script ID |
| `GAS_DEPLOYMENT_ID` | 初回デプロイで取得した Deployment ID |

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

**Deployment ID 固定方式**を採用。初回デプロイで取得したIDを使い回すことで、APIのURLが変わらない。

- API URL: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`
- 初回: `clasp deploy` → Deployment ID を取得
- 以降: `clasp deploy -i <DEPLOYMENT_ID>` → 同じURLで最新コードに更新

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
