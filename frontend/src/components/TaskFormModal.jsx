import { useEffect, useState } from 'react';

const emptyForm = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'Medium',
  status: 'Pending',
};

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

export function TaskFormModal({ task, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        dueDate: toDateInputValue(task.dueDate),
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate || null,
    });
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="modal__header">
          <h2 id="task-modal-title">{task ? 'Edit task' : 'Add a new task'}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Finish quarterly report"
              autoFocus
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional details..."
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="dueDate">Due date</label>
              <input
                id="dueDate"
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Saving...' : task ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
