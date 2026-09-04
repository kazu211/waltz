/** 親/子カテゴリを1つのキーにまとめる区切り文字（カテゴリ名に含まれない文字） */
const KEY_SEP = '\u0000';

/** 親カテゴリ + 子カテゴリ → 選択キー */
export const catKey = (parent: string, child: string) => `${parent}${KEY_SEP}${child}`;

/** 親カテゴリごとの子カテゴリ一覧（子が無い場合は [''] を持つ） */
export type CategoryTree = { parent: string; children: string[] }[];

/**
 * バッジに出す選択数。
 * 親配下がすべて選択されていれば 1、一部だけなら選択した子の数で数える。
 */
export function countSelected(tree: CategoryTree, selected: string[]): number {
  const set = new Set(selected);
  return tree.reduce((n, { parent, children }) => {
    const hit = children.filter(c => set.has(catKey(parent, c)));
    if (hit.length === 0) return n;
    return n + (hit.length === children.length ? 1 : hit.length);
  }, 0);
}
