import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', label: 'ダッシュボード', icon: '📊' },
  { to: '/monthly', label: '月次一覧', icon: '📋' },
  { to: '/chart', label: '月次グラフ', icon: '📈' },
  { to: '/trend', label: '年次推移', icon: '📉' },
  { to: '/compare', label: '月比較', icon: '🔄' },
  { to: '/settings', label: '設定', icon: '⚙️' },
];

export default function Layout() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">🎵 Waltz</h1>

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            aria-label="メニュー"
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          {/* デスクトップナビ */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
            <button
              onClick={logout}
              className="ml-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              ログアウト
            </button>
          </nav>
        </div>

        {/* モバイルナビ */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-200 bg-white px-4 py-2 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              ログアウト
            </button>
          </nav>
        )}
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
