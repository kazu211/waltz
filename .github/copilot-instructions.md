# Waltz - プロジェクト共通指示

## プロジェクト概要

Waltz は家計簿 Web アプリケーションです。Google Apps Script (GAS) をバックエンド、Google スプレッドシートをデータベースとして使用します。

## 推奨モデル

このプロジェクトでは **Claude Opus** の使用を推奨します。`/model` コマンドで切り替えてください。

## 技術スタック

- **バックエンド**: Google Apps Script (TypeScript)
- **フロントエンド**: React + Vite + TypeScript + Tailwind CSS（Phase 4 以降）
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
│   ├── tsconfig.json
│   └── .clasp.json.example ← clasp 設定テンプレート
├── shared/                 ← 共有型定義
│   └── types.ts
├── .github/
│   ├── workflows/
│   │   └── deploy-api.yml  ← GAS 自動デプロイ
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

> `api/` ディレクトリに `package.json` はありません。`api/` 内で直接 `npx` コマンドを実行しないでください。

### デプロイ

- `main` ブランチへのプッシュで GitHub Actions が自動デプロイ
- 手動: `npm run api:deploy`（要 `DEPLOYMENT_ID` 環境変数）

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
