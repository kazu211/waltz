# Waltz App

家計簿 Web アプリケーション「Waltz」のフロントエンド。React + TypeScript + Tailwind CSS で構築されています。

## 技術スタック

| 技術 | バージョン |
|---|---|
| React | 19 |
| TypeScript | 5.9 |
| Vite | 7 |
| Tailwind CSS | 4.2 |
| React Router | 7 (HashRouter) |
| Recharts | 3 |

## 画面構成

| # | 画面 | パス | 説明 |
|---|---|---|---|
| 1 | ログイン | `/` | ID + パスワード認証 |
| 2 | ダッシュボード | `/dashboard` | 今月の収支サマリー、前月比 |
| 3 | 月次一覧 | `/monthly` | 月ごとの収支データ一覧。追加・編集・削除が可能 |
| 4 | 月次グラフ | `/monthly-chart` | カテゴリ別円グラフ、収入/支出の棒グラフ |
| 5 | 年次推移 | `/yearly` | 12ヶ月の月次収支推移（折れ線グラフ） |
| 6 | 設定 | `/settings` | メンバー一覧、カテゴリ一覧、ログアウト |

## 開発

### npm scripts（プロジェクトルートから実行）

| コマンド | 用途 |
|---|---|
| `npm run app:dev` | 開発サーバー起動（モックデータモード） |
| `npm run app:build` | プロダクションビルド |
| `npm run app:preview` | ビルド結果のプレビュー |
| `npm run app:copy-types` | 共有型定義を app 用に変換・コピー |

### モックモード

デフォルトではモックデータで動作します。

- **ログイン情報**: ID `demo` / パスワード `demo`

実際の API に接続する場合は `app/.env.local` を作成してください：

```env
VITE_USE_MOCK=false
VITE_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

> `VITE_API_URL` はビルド時に埋め込まれます。API URL はソースコードにコミットしないでください。

## デプロイ

GitHub Pages にデプロイされます。

- **URL**: `https://<username>.github.io/waltz/`
- **ルーティング**: HashRouter を使用（`/#/monthly` 等）
- **トリガー**: `main` ブランチへのプッシュ時、`app/` または `shared/` 配下のファイルが変更された場合に自動デプロイ
- **手動実行**: GitHub Actions の workflow_dispatch で可能

> GitHub Pages のデプロイには、リポジトリの Settings > Pages で Source を「GitHub Actions」に設定する必要があります。

### 必要な Variables

リポジトリの Settings > Secrets and variables > Actions > Variables に設定：

| 変数名 | 値 |
|---|---|
| `VITE_API_URL` | GAS Web App の URL |

## 注意事項

### CORS

GitHub Pages（`*.github.io`）から GAS（`script.google.com`）への通信はクロスオリジンになります。GAS はリダイレクト（302）を挟むため、フロントエンドの `fetch` で `redirect: 'follow'` を設定してください。

### GAS のレスポンス速度

GAS は初回実行（コールドスタート）で数秒かかることがあります。フロントエンドではローディング表示と `localStorage` キャッシュを活用しています。

