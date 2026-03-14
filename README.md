# Waltz - 家計簿 Web アプリケーション

家計の収支を記録・管理する Web アプリケーション。PC・スマートフォンのブラウザから利用可能。

## 技術スタック

| 区分 | 技術 |
|---|---|
| バックエンド | Google Apps Script (TypeScript) |
| フロントエンド | React + Vite + TypeScript + Tailwind CSS |
| データベース | Google スプレッドシート |
| ホスティング（API） | GAS Web App |
| ホスティング（フロント） | GitHub Pages |
| デプロイ | clasp + GitHub Actions |
| リポジトリ構成 | モノレポ |

## ディレクトリ構成

```
waltz/
├── api/                    ← GAS バックエンド
│   ├── src/
│   │   ├── main.ts         ← API メインコード
│   │   └── appsscript.json ← GAS プロジェクト設定
│   ├── scripts/
│   │   └── deploy.js       ← デプロイスクリプト
│   ├── openapi.yaml        ← API 仕様書（OpenAPI 3.0）
│   ├── tsconfig.json
│   └── .clasp.json.example ← clasp 設定テンプレート
├── app/                    ← React フロントエンド
│   ├── src/
│   │   ├── components/     ← 共通コンポーネント
│   │   ├── contexts/       ← React Context（認証等）
│   │   ├── lib/            ← API クライアント等
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
│       ├── deploy-api.yml  ← GAS 自動デプロイ
│       └── deploy-app.yml  ← GitHub Pages 自動デプロイ
├── package.json
└── README.md
```

詳細なドキュメントは各ディレクトリの README を参照してください。

- **[api/README.md](./api/README.md)** - API 仕様、データ構造、curl 例
- **[api/openapi.yaml](./api/openapi.yaml)** - OpenAPI 3.0 仕様書
- **[app/README.md](./app/README.md)** - フロントエンド開発ガイド

---

## 初回セットアップ

### 前提条件

- Node.js 20 以上
- npm
- Google アカウント

### Step 1. リポジトリのクローンと依存パッケージのインストール

```bash
git clone <repository-url>
cd waltz
npm install
cd app && npm install && cd ..
```

### Step 2. clasp ログイン

```bash
npm run api:login
```

ブラウザが開くので Google アカウントでログインしてください。

### Step 3. Google スプレッドシートの作成

1. [Google Drive](https://drive.google.com/) で新しい Google スプレッドシートを作成
2. スプレッドシート名を「Waltz」に変更

### Step 4. GAS プロジェクトの作成と clasp の設定

1. 作成したスプレッドシートを開く
2. メニューの **「拡張機能」→「Apps Script」** を選択
3. GAS エディタが開いたら、左メニューの **「プロジェクトの設定」（⚙）** を選択
4. **「スクリプト ID」** をコピー
5. ターミナルに戻り、`.clasp.json` を作成：

```bash
cp api/.clasp.json.example api/.clasp.json
```

6. `api/.clasp.json` を開き、スクリプト ID を設定：

```json
{
  "scriptId": "コピーしたスクリプトID",
  "rootDir": "src"
}
```

### Step 5. 初回デプロイ

```bash
npm run api:deploy
```

初回は新規デプロイが作成されます。2回目以降は同じ Deployment ID で再デプロイされるため URL が変わりません。

### Step 6. スプレッドシートの初期化

デプロイ後、GAS エディタ上でシート（家計簿・カテゴリ・メンバー）を自動作成します。

1. GAS エディタを開く：

```bash
npm run api:open
```

2. GAS エディタの上部にある **関数選択ドロップダウン**（「関数を選択」と表示されている箇所）から **`initializeSpreadsheet`** を選択
3. **「▶ 実行」ボタン** をクリック
4. 初回実行時は権限の承認を求められるので **「許可」** をクリック
5. 完了ダイアログが表示されれば成功

> 💡 `initializeSpreadsheet` は何度実行しても安全です（既存のシートはスキップされます）。

### Step 7. 動作確認

Deployment ID を確認：

```bash
npm run api:deployments
```

API の動作確認：

```bash
curl -L -X POST "https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?action=list" \
  -H "Content-Type: application/json" \
  -d '{}'
```

以下のレスポンスが返れば成功です：

```json
{"success":true,"data":[]}
```

### Step 8. 認証情報の設定（推奨）

API を外部アクセスから保護するために認証情報を設定します。

1. GAS エディタを開く（`npm run api:open`）
2. 左メニューの **「プロジェクトの設定」（⚙）** を選択
3. **「スクリプト プロパティ」** セクションで以下を追加：

| プロパティ | 値 |
|---|---|
| `AUTH_ID` | ログイン ID（任意の文字列） |
| `AUTH_PASSWORD` | ログインパスワード（推奨: 16文字以上） |

設定後、すべての API リクエストの body に `"authId"` / `"authPassword"` を含める必要があります。

> 認証情報を設定しない場合は、認証なしで API にアクセスできます。開発中は未設定のまま動作確認し、運用開始時に設定することを推奨します。

---

## GitHub Actions によるデプロイ

`main` ブランチへのプッシュ時に自動デプロイが実行されます。

| 対象 | トリガー | デプロイ先 |
|---|---|---|
| API | `api/` または `shared/` の変更 | GAS Web App |
| フロントエンド | `app/` または `shared/` の変更 | GitHub Pages |

どちらも手動実行（workflow_dispatch）が可能です。

### 必要なシークレット

リポジトリの Settings > Secrets and variables > Actions に設定：

| シークレット名 | 値 | 取得方法 |
|---|---|---|
| `CLASPRC_JSON` | clasp の認証情報 | `cat ~/.clasprc.json` の内容 |
| `GAS_SCRIPT_ID` | GAS の Script ID | GAS エディタ > プロジェクトの設定 |

### 必要な Variables

| 変数名 | 値 |
|---|---|
| `VITE_API_URL` | GAS Web App の URL（`https://script.google.com/macros/s/.../exec`） |

> GitHub Pages のデプロイには、リポジトリの Settings > Pages で Source を「GitHub Actions」に設定する必要があります。
