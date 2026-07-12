import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type TaskStatusFilter = 'all' | 'active' | 'completed';
type CategoryFilter = 'all' | Task['category'];
type PriorityFilter = 'all' | Task['priority'];
type Category = 'Personal' | 'Work' | 'Home' | 'Study';
type Priority = 'Low' | 'Medium' | 'High';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  category: Category;
  priority: Priority;
  createdAt: number;
};

const STORAGE_KEY = 'daylist.react.tasks';
const categories: Category[] = ['Personal', 'Work', 'Home', 'Study'];
const priorities: Priority[] = ['Low', 'Medium', 'High'];

const formatToday = () =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

const loadTasks = (): Task[] => {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? (JSON.parse(savedTasks) as Task[]) : [];
  } catch {
    return [];
  }
};

function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Personal');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Persist every task change so the list survives browser refreshes.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const remainingTasks = tasks.filter((task) => !task.completed).length;

  const visibleTasks = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch = [task.title, task.category, task.priority].some((value) =>
        value.toLowerCase().includes(searchTerm),
      );
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !task.completed) ||
        (statusFilter === 'completed' && task.completed);
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [categoryFilter, priorityFilter, search, statusFilter, tasks]);

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      completed: false,
      category,
      priority,
      createdAt: Date.now(),
    };

    setTasks((currentTasks) => [newTask, ...currentTasks]);
    setTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    );
  };

  const deleteTask = (id: string) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = (id: string) => {
    const nextTitle = editTitle.trim();
    if (!nextTitle) return;

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === id ? { ...task, title: nextTitle } : task)),
    );
    setEditingId(null);
    setEditTitle('');
  };

  const clearCompleted = () => {
    setTasks((currentTasks) => currentTasks.filter((task) => !task.completed));
  };

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <section className="hero-card">
        <p className="eyebrow">Plan your day</p>
        <h1 id="app-title">DayList</h1>
        <p className="hero-copy">A focused to-do list for priorities, categories, and daily momentum.</p>
        <p className="today-pill" aria-label="Today's date">{formatToday()}</p>
      </section>

      <section className="task-card" aria-label="Task manager">
        <form className="task-form" onSubmit={addTask}>
          <label className="field task-title-field">
            <span>Task</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Add a task, e.g. Review project notes" />
          </label>
          <label className="field compact-field">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field compact-field">
            <span>Priority</span>
            <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
              {priorities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button className="primary-button" type="submit">Add task</button>
        </form>

        <div className="toolbar">
          <label className="search-field">
            <span>Search</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, categories, priorities" />
          </label>
          <FilterSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as TaskStatusFilter)} options={['all', 'active', 'completed']} />
          <FilterSelect label="Category" value={categoryFilter} onChange={(value) => setCategoryFilter(value as CategoryFilter)} options={['all', ...categories]} />
          <FilterSelect label="Priority" value={priorityFilter} onChange={(value) => setPriorityFilter(value as PriorityFilter)} options={['all', ...priorities]} />
        </div>

        <div className="status-row" aria-live="polite">
          <span>{remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'} remaining</span>
          <button className="text-button" type="button" onClick={clearCompleted} disabled={!tasks.some((task) => task.completed)}>Clear completed</button>
        </div>

        <ul className="task-list" aria-label="Tasks">
          {visibleTasks.map((task) => (
            <li className={`task-item ${task.completed ? 'completed' : ''}`} key={task.id}>
              <button className="task-checkbox" type="button" onClick={() => toggleTask(task.id)} aria-label={task.completed ? 'Mark active' : 'Mark complete'}>{task.completed ? '✓' : ''}</button>
              <div className="task-content">
                {editingId === task.id ? (
                  <input className="edit-input" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} onKeyDown={(event) => {
                    if (event.key === 'Enter') saveEdit(task.id);
                    if (event.key === 'Escape') setEditingId(null);
                  }} autoFocus />
                ) : (
                  <span className="task-text">{task.title}</span>
                )}
                <div className="task-meta">
                  <span>{task.category}</span>
                  <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                </div>
              </div>
              <div className="task-actions">
                {editingId === task.id ? <button className="icon-button" type="button" onClick={() => saveEdit(task.id)}>Save</button> : <button className="icon-button" type="button" onClick={() => startEditing(task)}>Edit</button>}
                <button className="icon-button delete" type="button" onClick={() => deleteTask(task.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>

        {visibleTasks.length === 0 && (
          <div className="empty-state">
            <div aria-hidden="true">✦</div>
            <h2>No tasks found</h2>
            <p>Add a task or adjust your search and filters.</p>
          </div>
        )}
      </section>
    </main>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="field filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}
      </select>
    </label>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
