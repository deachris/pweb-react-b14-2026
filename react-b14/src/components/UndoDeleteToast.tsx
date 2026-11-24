interface UndoDeleteToastProps {
  company: string;
  role: string;
  error: string;
  onUndo: () => void;
}

export function UndoDeleteToast({
  company,
  role,
  error,
  onUndo,
}: UndoDeleteToastProps) {
  return (
    <aside
      className="undo-toast"
      role="status"
      aria-live="polite"
    >
      <p>
        <strong>
          {company} — {role}
        </strong>{' '}
        dihapus.
      </p>

      <p>
        Undo tersedia selama 5 detik sejak penghapusan terakhir.
      </p>

      <button
        type="button"
        className="btn btn-outline"
        onClick={onUndo}
      >
        Undo
      </button>

      {error && <p role="alert">{error}</p>}
    </aside>
  );
}