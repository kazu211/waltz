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
| 1 | ログイン | `/login` | ID + パスワード認証 |
| 2 | 月次グラフ | `/` | トップページ。収支バランス・貯蓄率・カテゴリ別円グラフ |
| 3 | 月次一覧 | `/monthly` | 月ごとの収支データ一覧。追加・編集・削除・レシートスキャン |
| 4 | 年次推移 | `/trend` | 12ヶ月の収支推移・貯蓄率推移・カテゴリトレンド |
| 5 | 月比較 | `/compare` | 任意の2ヶ月間のカテゴリ別比較・構成比較 |
| 6 | 設定 | `/settings` | ログイン情報の管理 |

全画面で使用者（persons）フィルタに対応しています。

## 主要機能

- **収支管理**: 家計簿レコードの CRUD 操作
- **レシートスキャン**: 📷 ボタンからレシート画像を撮影/アップロード → AI（Gemini API）が日付・店名・金額を自動抽出 → フォームにプリフィル
- **グラフ分析**: カテゴリ別円グラフ（親/子切替）、年次推移、月間比較
- **貯蓄率表示**: 収入に対する貯蓄の割合を表示
- **使用者フィルタ**: 全画面で特定メンバーのデータのみ表示可能

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

GitHub Pages（`*.github.io`）から GAS（`script.google.com`）への通信はクロスオリジンになります。`Content-Type: text/plain` を使用してプリフライトリクエストを回避しています（GAS は `doOptions()` をサポートしないため）。`fetch` で `redirect: 'follow'` を設定してください。

### GAS のレスポンス速度

GAS は初回実行（コールドスタート）で数秒かかることがあります。フロントエンドではローディング表示と `localStorage` キャッシュを活用しています。

