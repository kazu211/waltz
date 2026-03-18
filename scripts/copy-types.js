/**
 * shared/types.ts を api/ と app/ にコピーするスクリプト
 *
 * - api/src/types.ts: そのままコピー（GAS はグローバルスコープ）
 * - app/src/types.ts: type / interface の行頭に export を付与
 *
 * 使い方:
 *   node scripts/copy-types.js        -- 両方にコピー
 *   node scripts/copy-types.js api    -- api のみ
 *   node scripts/copy-types.js app    -- app のみ
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'shared', 'types.ts');
const target = process.argv[2]; // 'api' | 'app' | undefined(=both)

const content = fs.readFileSync(src, 'utf8');

if (!target || target === 'api') {
  const dest = path.join(root, 'api', 'src', 'types.ts');
  fs.writeFileSync(dest, content);
  console.log('Copied shared/types.ts -> api/src/types.ts');
}

if (!target || target === 'app') {
  const exported = content.replace(/^(type |interface )/gm, 'export $1');
  const dest = path.join(root, 'app', 'src', 'types.ts');
  fs.writeFileSync(dest, exported);
  console.log('Copied shared/types.ts -> app/src/types.ts (with export)');
}
