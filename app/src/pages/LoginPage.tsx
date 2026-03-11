import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { verifyLogin } from '../lib/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export default function LoginPage() {
  const { login } = useAuth();
  const [authId, setAuthId] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!authId.trim()) {
      setError('ID を入力してください');
      return;
    }
    if (!authPassword.trim()) {
      setError('パスワードを入力してください');
      return;
    }

    setLoading(true);
    try {
      await verifyLogin(authId.trim(), authPassword.trim());
      login(authId.trim(), authPassword.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎵 Waltz</h1>
          <p className="mt-2 text-gray-600">家計簿アプリケーション</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <div>
            <label htmlFor="authId" className="block text-sm font-medium text-gray-700 mb-1">
              ID
            </label>
            <input
              id="authId"
              type="text"
              value={authId}
              onChange={e => setAuthId(e.target.value)}
              placeholder="ID を入力"
              autoComplete="username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label htmlFor="authPassword" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              id="authPassword"
              type="password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              placeholder="パスワードを入力"
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          {USE_MOCK && (
            <p className="text-xs text-gray-400 text-center">
              デモモード — ID: demo / パスワード: demo
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
