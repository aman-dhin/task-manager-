export function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Delete' }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 380 }} role="alertdialog" aria-modal="true">
        <div className="modal__header">
          <h2>{title}</h2>
        </div>
        <p style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>{message}</p>
        <div className="modal__actions">
          <button className="btn btn-secondary btn-block" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger btn-block" style={{ background: 'var(--color-danger)', color: '#fff' }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
