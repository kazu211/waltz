# Waltz - プロジェクト共通指示

## プロジェクト概要

Waltz は家計簿 Web アプリケーションです。Google Apps Script (GAS) をバックエンド、Google スプレッドシートをデータベースとして使用します。

## 推奨モデル

このプロジェクトでは **Claude Opus** の使用を推奨します。`/model` コマンドで切り替えてください。

## 技術スタック

- **バックエンド**: Google Apps Script (TypeScript)
- **フロントエンド**: React + Vite + TypeScript + Tailwind CSS
- **データベース**: Google スプレッドシート
- **ホスティング（API）**: GAS Web App
- **ホスティング（フロント）**: GitHub Pages
- **デプロイ**: clasp + GitHub Actions
- **リポジトリ構成**: モノレポ

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
├── scripts/                ← ビルドスクリプト
│   └── copy-types.js       ← 共有型定義のコピー
├── .github/
│   ├── workflows/
│   │   ├── deploy-api.yml  ← GAS 自動デプロイ
│   │   └── deploy-app.yml  ← GitHub Pages 自動デプロイ
│   ├── instructions/       ← Copilot トピック別指示
│   └── copilot-instructions.md
├── package.json
├── .nvmrc
├── .editorconfig
├── .gitignore
└── README.md
```

## 開発フロー

### コード変更の反映

```bash
# ルートディレクトリから実行（共有型定義のコピー + clasp push）
npm run api:push
```

> `api/` 内で直接 `npx clasp` コマンドを実行しないでください。必ずルートディレクトリから `npm run api:*` を使用してください。

### 利用可能な npm scripts

| コマンド | 用途 |
|---|---|
| `npm run api:login` | clasp ログイン |
| `npm run api:push` | 共有型定義のコピー + GAS にプッシュ |
| `npm run api:deploy` | コードプッシュ + デプロイ（Deployment ID 自動取得） |
| `npm run api:deployments` | デプロイ一覧を表示 |
| `npm run api:open` | GAS エディタを開く |
| `npm run api:logs` | GAS ログを表示 |

## コーディング規約

- 言語: TypeScript (strict mode)
- インデント: スペース 2
- 改行コード: LF
- 文字コード: UTF-8
- 回答言語: 日本語

## 作業ルール

### ドキュメント更新

- 機能追加・変更を行った場合は、関連するドキュメント（README.md、api/README.md、app/README.md 等）も必ず更新すること
- API の追加・変更時は、api/README.md の curl 例とアクション一覧も更新すること

### バージョン管理

- 機能追加や重要な変更を行った場合は、セマンティックバージョニングに基づいてバージョンアップを提案すること
  - MAJOR: 破壊的変更
  - MINOR: 新機能追加（後方互換）
  - PATCH: バグ修正
- ユーザーの承認を得てからバージョンを更新すること（`package.json`、`app/package.json` の両方）

### Git

- Copilot からコミットは行わない。変更はユーザーが手動でコミットする
- 変更完了時に `git diff --stat` で変更ファイル一覧を提示する

### CORS（GAS 固有）

- GAS は `doOptions()` をサポートしないため、`Content-Type: application/json` はプリフライトリクエストが発生し 405 エラーになる
- フロントエンドから GAS への通信は `Content-Type: text/plain` を使用すること（GAS は `e.postData.contents` で body を読み取るため問題なし）

### アセットパス

- 画像やアイコンのパスには `import.meta.env.BASE_URL` を使用すること（`/waltz/` のようなハードコードは不可）

## UI 規約

### カラースキーム

全画面で統一すること:

| 意味 | テキスト色 | カラーコード |
|---|---|---|
| 収入 | `text-green-600` | `#10b981` |
| 支出 | `text-red-600` | `#ef4444` |
| 収支（プラス） | `text-blue-600` | `#3b82f6` |
| 収支（マイナス） | `text-amber-600` | `#f59e0b` |

### 年月セレクタ

- 年の選択範囲: 過去5年〜未来1年（◀/▶ スライドは使用しない）
- ドロップダウン `<select>` で直接選択できるようにする

### グラフ

- グラフタイトルにグラフ種別（棒グラフ、円グラフ等）を含めない

## 重要な注意事項

- `shared/types.ts` は共有型定義のソースです。`api/src/types.ts` はビルド時にコピーされる生成ファイルのため、直接編集しないでください
- GAS プロジェクトはスプレッドシートにコンテナバインドされています。`SpreadsheetApp.getActiveSpreadsheet()` を使用しており、`openById()` は使用しません
- `appsscript.json` は `api/src/` 配下にあります（clasp の `rootDir: "src"` と整合させるため）
