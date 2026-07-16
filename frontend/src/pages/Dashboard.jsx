import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { Navbar } from '../components/Navbar';
import { TaskCard } from '../components/TaskCard';
import { TaskFormModal } from '../components/TaskFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Loader } from '../components/Loader';
import { Toast } from '../components/Toast';

const PAGE_SIZE = 8;

export function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, completed: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = (message, type = 'info') => setToast({ message, type });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (statusTab !== 'All') params.status = statusTab;
      if (priorityFilter) params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusTab, priorityFilter, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [statusTab, priorityFilter, search]);

  const openAddModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSubmitTask = async (formData) => {
    setSubmitting(true);
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id || editingTask._id}`, formData);
        showToast('Task updated');
      } else {
        await api.post('/tasks', formData);
        showToast('Task added');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await api.put(`/tasks/${task.id || task._id}`, { status: nextStatus });
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update task', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      await api.delete(`/tasks/${deletingTask.id || deletingTask._id}`);
      showToast('Task deleted');
      setDeletingTask(null);
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete task', 'error');
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="dashboard">
        <div className="container">
          <div className="dashboard__header">
            <div>
              <h1 className="dashboard__title">Your tasks</h1>
              <p className="dashboard__subtitle">Stay on top of what matters today</p>
            </div>
            <button className="btn btn-primary" onClick={openAddModal}>
              + Add task
            </button>
          </div>

          <div className="stats-row">
            <div className="stat-card stat-card--total">
              <div className="stat-card__value">{summary.total}</div>
              <div className="stat-card__label">Total</div>
            </div>
            <div className="stat-card stat-card--pending">
              <div className="stat-card__value">{summary.pending}</div>
              <div className="stat-card__label">Pending</div>
            </div>
            <div className="stat-card stat-card--completed">
              <div className="stat-card__value">{summary.completed}</div>
              <div className="stat-card__label">Completed</div>
            </div>
          </div>

          <div className="toolbar">
            <div className="tab-group">
              {['All', 'Pending', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  className={statusTab === tab ? 'active' : ''}
                  onClick={() => setStatusTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="toolbar__search">
              <span className="toolbar__search-icon" aria-hidden="true">⌕</span>
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search tasks"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {loading ? (
            <Loader />
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>
                {search || priorityFilter || statusTab !== 'All'
                  ? 'Try adjusting your filters or search term.'
                  : 'Add your first task to get started.'}
              </p>
              <button className="btn btn-primary" onClick={openAddModal}>
                + Add task
              </button>
            </div>
          ) : (
            <>
              <div className="task-list">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id || task._id}
                    task={task}
                    onToggleStatus={handleToggleStatus}
                    onEdit={openEditModal}
                    onDelete={setDeletingTask}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="pagination__label">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {modalOpen && (
        <TaskFormModal
          task={editingTask}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmitTask}
          submitting={submitting}
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Delete this task?"
          message={`"${deletingTask.title}" will be permanently removed. This can't be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
}
