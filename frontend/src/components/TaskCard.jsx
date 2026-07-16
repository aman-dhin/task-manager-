function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'Completed') return false;
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function TaskCard({ task, onToggleStatus, onEdit, onDelete }) {
  const overdue = isOverdue(task.dueDate, task.status);
  const completed = task.status === 'Completed';

  return (
    <div className={`task-card task-card--${task.priority} ${completed ? 'task-card--completed' : ''}`}>
      <div className="task-card__check">
        <input
          type="checkbox"
          className="checkbox"
          checked={completed}
          onChange={() => onToggleStatus(task)}
          aria-label={completed ? 'Mark as pending' : 'Mark as completed'}
        />
      </div>

      <div className="task-card__body">
        <div className="task-card__top">
          <div>
            <div className="task-card__title">{task.title}</div>
            {task.description && (
              <div className="task-card__description">{task.description}</div>
            )}
          </div>

          <div className="task-card__actions">
            <button className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit task" title="Edit">
              ✎
            </button>
            <button
              className="icon-btn icon-btn--danger"
              onClick={() => onDelete(task)}
              aria-label="Delete task"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="task-card__meta">
          <span className={`tag tag--${task.priority}`}>{task.priority}</span>
          <span className={`tag ${completed ? 'tag--status-completed' : 'tag--status-pending'}`}>
            {task.status}
          </span>
          {task.dueDate && (
            <span className={`tag ${overdue ? 'tag--overdue' : 'tag--due'}`}>
              {overdue ? 'Overdue · ' : 'Due '}
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
