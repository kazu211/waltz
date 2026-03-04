/**
 * GAS Web App デプロイスクリプト
 *
 * clasp deployments から最新の Deployment ID を自動取得してデプロイする。
 * バージョン付きデプロイが存在しない場合は新規デプロイを作成する。
 */
const { execSync } = require('child_process');

const API_DIR = 'api';
const EXEC_OPTIONS = { cwd: API_DIR, encoding: 'utf-8' };

function getDeploymentId() {
  const output = execSync('npx clasp deployments', EXEC_OPTIONS);
  // @HEAD 以外のバージョン付きデプロイを抽出（例: "- AKfycbx... @1."）
  const matches = [...output.matchAll(/- (\S+) @(\d+)/g)];
  if (matches.length === 0) return null;
  // 最新バージョンのデプロイ ID を返す
  return matches.sort((a, b) => Number(b[2]) - Number(a[2]))[0][1];
}

try {
  const deploymentId = getDeploymentId();

  if (deploymentId) {
    console.log(`既存の Deployment ID を使用: ${deploymentId}`);
    execSync(`npx clasp deploy -i ${deploymentId} -d "Deploy from npm script"`, {
      ...EXEC_OPTIONS,
      stdio: 'inherit',
    });
  } else {
    console.log('バージョン付きデプロイが存在しないため、新規デプロイを作成します。');
    execSync('npx clasp deploy -d "Initial deploy"', {
      ...EXEC_OPTIONS,
      stdio: 'inherit',
    });
  }
} catch (error) {
  console.error('デプロイに失敗しました:', error.message);
  process.exit(1);
}
