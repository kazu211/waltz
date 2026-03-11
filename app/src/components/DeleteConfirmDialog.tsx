interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmDialog({ message, onConfirm, onCancel, loading }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <p className="text-gray-800 text-sm">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? '削除中...' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  );
}
