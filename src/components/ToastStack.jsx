export function ToastStack({ toasts, onClose }) {
  if (!toasts?.length) return null

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <p>{toast.message}</p>
          <button type="button" aria-label="Dismiss notification" onClick={() => onClose(toast.id)}>
            x
          </button>
        </div>
      ))}
    </div>
  )
}
