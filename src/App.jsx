import React from "react";
import { useEffect, useMemo, useState } from "react";
import { api, authStorage } from "./api";

const emptyForm = {
  title: "",
  description: "",
  category: "Учёба",
  priority: "medium",
  dueDate: "",
};

const categories = ["Учёба", "Работа", "Личное", "Проект", "Другое"];

function formatDate(value) {
  if (!value) return "Без срока";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function isOverdue(task) {
  return !task.isCompleted && task.dueDate && new Date(task.dueDate) < new Date();
}

function priorityLabel(priority) {
  return { low: "Низкий", medium: "Средний", high: "Высокий" }[priority] || "Средний";
}

function AuthScreen({ onAuthenticated }) {
  const [login, setLogin] = useState("demo");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      setSaving(true);
      const result = await api.login(login, password);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err.message || "Не удалось выполнить вход.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">TASK MANAGER</p>
        <h1>Вход</h1>
        <p className="auth-subtitle">Используй демонстрационный аккаунт для входа.</p>

        <form className="auth-form" onSubmit={submit}>
          <label>Логин<input value={login} onChange={(e) => setLogin(e.target.value)} required placeholder="demo" /></label>
          <label>Пароль<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="demo123" /></label>
          {error && <div className="error">{error}</div>}
          <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Входим..." : "Войти"}</button>
        </form>

        <div className="demo-hint">
          <strong>Демо-аккаунт</strong>
          <span>Логин: <code>demo</code> · Пароль: <code>demo123</code></span>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, overdue: 0, highPriority: 0, completionRate: 0 });
  const [form, setForm] = useState(emptyForm);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ search: "", category: "all", priority: "all", status: "all", sort: "default" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh(nextFilters = filters) {
    try {
      setLoading(true);
      setError("");
      const [nextTasks, nextStats] = await Promise.all([api.getTasks(nextFilters), api.getStats()]);
      setTasks(nextTasks);
      setStats(nextStats);
    } catch (err) {
      if (err.status === 401) { authStorage.clear(); onLogout(); return; }
      setError(err.message || "Не удалось загрузить данные.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [filters.search, filters.category, filters.priority, filters.status, filters.sort]);

  function changeForm(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  async function addTask(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    try {
      setSaving(true); setError("");
      await api.createTask({ ...form, title: form.title.trim(), dueDate: form.dueDate || null });
      setForm(emptyForm);
      await refresh();
    } catch (err) { setError(err.message || "Не удалось создать задачу."); }
    finally { setSaving(false); }
  }

  async function toggleTask(task) {
    try {
      setError("");
      await api.toggleTask(task.id);
      await refresh();
    } catch (err) { setError(err.message || "Не удалось изменить статус."); }
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editingTask?.title.trim()) return;
    try {
      setSaving(true); setError("");
      await api.updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        category: editingTask.category,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate || null,
        isCompleted: editingTask.isCompleted,
      });
      setEditingTask(null); await refresh();
    } catch (err) { setError(err.message || "Не удалось сохранить задачу."); }
    finally { setSaving(false); }
  }

  async function deleteTask(id) {
    if (!window.confirm("Удалить эту задачу?")) return;
    try { await api.deleteTask(id); await refresh(); }
    catch (err) { setError(err.message || "Не удалось удалить задачу."); }
  }

  async function deleteCompleted() {
    if (!stats.completed || !window.confirm("Удалить все выполненные задачи?")) return;
    try { await api.deleteCompleted(); await refresh(); }
    catch (err) { setError(err.message || "Не удалось удалить выполненные задачи."); }
  }

  const visibleInfo = useMemo(() => {
    if (loading) return "Загрузка...";
    if (!tasks.length) return "Задачи не найдены";
    return `${tasks.length} ${tasks.length === 1 ? "задача" : tasks.length < 5 ? "задачи" : "задач"}`;
  }, [tasks, loading]);

  return (
    <main className="page">
      <section className="app-card">
        <header className="header">
          <div>
            <p className="eyebrow">TASK MANAGER</p>
            <div className="title-row"><div><h1>Мои задачи</h1><p className="subtitle">Аккаунт: <strong>{user.username}</strong> · {user.email}</p></div><button className="logout-button" onClick={onLogout}>Выйти</button></div>
          </div>
          <div className="completion-ring"><strong>{stats.completionRate}%</strong><span>выполнено</span></div>
        </header>

        <section className="stats-grid">
          <div className="stat-card"><span>Всего</span><strong>{stats.total}</strong></div>
          <div className="stat-card"><span>Активные</span><strong>{stats.active}</strong></div>
          <div className="stat-card"><span>Выполнено</span><strong>{stats.completed}</strong></div>
          <div className="stat-card danger-stat"><span>Просрочены</span><strong>{stats.overdue}</strong></div>
          <div className="stat-card"><span>Высокий приоритет</span><strong>{stats.highPriority}</strong></div>
        </section>

        <form className="task-form" onSubmit={addTask}>
          <div className="form-heading"><div><h2>Новая задача</h2><span>Она будет сохранена именно под твоим аккаунтом.</span></div></div>
          <input value={form.title} onChange={(e) => changeForm("title", e.target.value)} placeholder="Например: сдать лабораторную" maxLength={200} required />
          <textarea value={form.description} onChange={(e) => changeForm("description", e.target.value)} placeholder="Описание задачи" rows={3} maxLength={2000} />
          <div className="form-row">
            <select value={form.category} onChange={(e) => changeForm("category", e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={form.priority} onChange={(e) => changeForm("priority", e.target.value)}><option value="low">Низкий приоритет</option><option value="medium">Средний приоритет</option><option value="high">Высокий приоритет</option></select>
            <input type="date" value={form.dueDate} onChange={(e) => changeForm("dueDate", e.target.value)} />
            <button type="submit" disabled={saving}>{saving ? "Сохраняем..." : "Добавить задачу"}</button>
          </div>
        </form>

        {error && <div className="error">{error}</div>}

        <section className="toolbar">
          <div className="search-box"><span>⌕</span><input value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} placeholder="Поиск по задачам..." /></div>
          <select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}><option value="all">Все статусы</option><option value="active">Активные</option><option value="completed">Выполненные</option><option value="overdue">Просроченные</option></select>
          <select value={filters.category} onChange={(e) => setFilters((current) => ({ ...current, category: e.target.value }))}><option value="all">Все категории</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={filters.priority} onChange={(e) => setFilters((current) => ({ ...current, priority: e.target.value }))}><option value="all">Любой приоритет</option><option value="high">Высокий</option><option value="medium">Средний</option><option value="low">Низкий</option></select>
          <select value={filters.sort} onChange={(e) => setFilters((current) => ({ ...current, sort: e.target.value }))}><option value="default">Сначала важные</option><option value="duedate">По дедлайну</option><option value="priority">По приоритету</option><option value="title">По названию</option></select>
        </section>

        <div className="list-head"><strong>{visibleInfo}</strong><button className="link-button" onClick={deleteCompleted} disabled={!stats.completed}>Очистить выполненные</button></div>

        <section className="tasks">
          {loading ? <div className="empty">Загрузка задач...</div> : tasks.length === 0 ? <div className="empty">Ничего не найдено. Попробуй изменить фильтры или добавить новую задачу.</div> : tasks.map((task) => (
            <article className={`task ${task.isCompleted ? "done" : ""} ${isOverdue(task) ? "overdue" : ""}`} key={task.id}>
              <button className="check" onClick={() => toggleTask(task)} aria-label="Изменить статус">{task.isCompleted ? "✓" : ""}</button>
              <div className="task-content">
                <div className="task-topline"><h2>{task.title}</h2><span className={`priority priority-${task.priority}`}>{priorityLabel(task.priority)}</span></div>
                {task.description && <p>{task.description}</p>}
                <div className="task-meta"><span className="badge">{task.category}</span><span className={isOverdue(task) ? "date overdue-text" : "date"}>{isOverdue(task) ? "Просрочено: " : "Дедлайн: "}{formatDate(task.dueDate)}</span></div>
              </div>
              <div className="task-actions"><button className="secondary" onClick={() => setEditingTask(task)}>Изменить</button><button className="delete" onClick={() => deleteTask(task.id)}>Удалить</button></div>
            </article>
          ))}
        </section>
      </section>

      {editingTask && (
        <div className="modal-backdrop" onMouseDown={() => setEditingTask(null)}>
          <form className="modal" onSubmit={saveEdit} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head"><div><p className="eyebrow">РЕДАКТИРОВАНИЕ</p><h2>Изменить задачу</h2></div><button type="button" className="icon-button" onClick={() => setEditingTask(null)}>×</button></div>
            <input value={editingTask.title} maxLength={200} onChange={(e) => setEditingTask((x) => ({ ...x, title: e.target.value }))} />
            <textarea value={editingTask.description || ""} maxLength={2000} rows={5} onChange={(e) => setEditingTask((x) => ({ ...x, description: e.target.value }))} />
            <div className="form-row"><select value={editingTask.category} onChange={(e) => setEditingTask((x) => ({ ...x, category: e.target.value }))}>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={editingTask.priority} onChange={(e) => setEditingTask((x) => ({ ...x, priority: e.target.value }))}><option value="low">Низкий приоритет</option><option value="medium">Средний приоритет</option><option value="high">Высокий приоритет</option></select><input type="date" value={editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : ""} onChange={(e) => setEditingTask((x) => ({ ...x, dueDate: e.target.value || null }))} /></div>
            <label className="checkbox-row"><input type="checkbox" checked={editingTask.isCompleted} onChange={(e) => setEditingTask((x) => ({ ...x, isCompleted: e.target.checked }))} />Задача выполнена</label>
            <div className="modal-actions"><button type="button" className="secondary" onClick={() => setEditingTask(null)}>Отмена</button><button type="submit" disabled={saving}>{saving ? "Сохраняем..." : "Сохранить"}</button></div>
          </form>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) { setCheckingAuth(false); return; }
    api.me()
      .then(setUser)
      .catch(() => { authStorage.clear(); setUser(null); })
      .finally(() => setCheckingAuth(false));
  }, []);

  function logout() {
    authStorage.clear();
    setUser(null);
  }

  if (checkingAuth) return <main className="auth-page"><div className="auth-loading">Проверяем вход...</div></main>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  return <Dashboard user={user} onLogout={logout} />;
}
