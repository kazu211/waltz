import { useEffect, useMemo, useRef, useState } from 'react';
import { catKey, type CategoryTree } from '../lib/category';

type Props = {
  tree: CategoryTree;
  selected: string[];
  onApply: (next: string[]) => void;
  onClose: () => void;
  /** dropdown=列ヘッダー配下に表示 / sheet=モバイルのモーダル表示 */
  variant?: 'dropdown' | 'sheet';
};

export default function CategoryFilter({ tree, selected, onApply, onClose, variant = 'dropdown' }: Props) {
  const [draft, setDraft] = useState<Set<string>>(() => new Set(selected));
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const set = new Set(selected);
    return new Set(tree.filter(t => t.children.some(c => set.has(catKey(t.parent, c)))).map(t => t.parent));
  });
  const panelRef = useRef<HTMLDivElement>(null);

  // 外側クリック / Escape で閉じる（適用はしない）
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current?.contains(target)) return;
      if (target.closest('[data-category-filter-toggle]')) return; // トグルボタン自身は除外
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  // 検索での絞り込み（親名がヒットしたら子は全件残す）
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tree;
    const result: CategoryTree = [];
    for (const { parent, children } of tree) {
      if (parent.toLowerCase().includes(q)) {
        result.push({ parent, children });
        continue;
      }
      const hit = children.filter(c => c.toLowerCase().includes(q));
      if (hit.length > 0) result.push({ parent, children: hit });
    }
    return result;
  }, [tree, query]);

  const searching = query.trim().length > 0;
  const isOpen = (parent: string) => searching || expanded.has(parent);

  const toggleExpand = (parent: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(parent)) next.delete(parent); else next.add(parent);
    return next;
  });

  const toggleChild = (parent: string, child: string) => setDraft(prev => {
    const next = new Set(prev);
    const key = catKey(parent, child);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const toggleParent = (parent: string, children: string[]) => setDraft(prev => {
    const next = new Set(prev);
    const allSelected = children.every(c => next.has(catKey(parent, c)));
    for (const c of children) {
      if (allSelected) next.delete(catKey(parent, c));
      else next.add(catKey(parent, c));
    }
    return next;
  });

  const parentState = (parent: string, children: string[]) => {
    const hit = children.filter(c => draft.has(catKey(parent, c))).length;
    return { checked: hit > 0 && hit === children.length, indeterminate: hit > 0 && hit < children.length };
  };

  const body = (
    <>
      <div className="p-2 border-b border-gray-100">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="カテゴリを検索"
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-normal text-gray-800"
        />
      </div>

      <div className="max-h-72 overflow-y-auto py-1">
        <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-normal text-gray-700 hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.size === 0}
            onChange={() => setDraft(new Set())}
            className="w-4 h-4 accent-blue-600"
          />
          すべて
        </label>
        <div className="border-t border-gray-100 my-1" />

        {visible.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-gray-400 font-normal">該当するカテゴリがありません</p>
        ) : visible.map(({ parent, children }) => {
          const hasChildren = children.some(c => c !== '');
          const state = parentState(parent, children);
          return (
            <div key={parent}>
              <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(parent)}
                    className="w-4 text-gray-400 hover:text-gray-700 text-xs leading-none"
                    aria-label={isOpen(parent) ? '折りたたむ' : '展開する'}
                  >
                    {isOpen(parent) ? '▾' : '▸'}
                  </button>
                ) : (
                  <span className="w-4" />
                )}
                <label className="flex items-center gap-2 flex-1 text-sm font-normal text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.checked}
                    ref={el => { if (el) el.indeterminate = state.indeterminate; }}
                    onChange={() => toggleParent(parent, children)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  {parent}
                </label>
              </div>
              {hasChildren && isOpen(parent) && children.map(child => (
                <label
                  key={child}
                  className="flex items-center gap-2 pl-9 pr-3 py-1.5 text-sm font-normal text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={draft.has(catKey(parent, child))}
                    onChange={() => toggleChild(parent, child)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  {child || '（未分類）'}
                </label>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setDraft(new Set())}
          className="text-xs font-normal text-gray-500 hover:text-gray-800 underline"
        >
          クリア
        </button>
        <button
          type="button"
          onClick={() => { onApply([...draft]); onClose(); }}
          className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          適用
        </button>
      </div>
    </>
  );

  if (variant === 'sheet') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
        <div ref={panelRef} className="w-full bg-white rounded-t-xl shadow-lg max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-800">カテゴリで絞り込み</p>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700" aria-label="閉じる">✕</button>
          </div>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-full mt-1 z-30 w-64 bg-white border border-gray-200 rounded-lg shadow-lg"
    >
      {body}
    </div>
  );
}
