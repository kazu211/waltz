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

## 重要な注意事項

- `shared/types.ts` は共有型定義のソースです。`api/src/types.ts` はビルド時にコピーされる生成ファイルのため、直接編集しないでください
- GAS プロジェクトはスプレッドシートにコンテナバインドされています。`SpreadsheetApp.getActiveSpreadsheet()` を使用しており、`openById()` は使用しません
- `appsscript.json` は `api/src/` 配下にあります（clasp の `rootDir: "src"` と整合させるため）
