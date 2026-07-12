const STORAGE_KEY = 'daylist.tasks';
const THEME_KEY = 'daylist.theme';

const taskForm = document.querySelector('#taskForm');
const taskInput = document.querySelector('#taskInput');
const submitButton = document.querySelector('#submitButton');
const searchInput = document.querySelector('#searchInput');
const taskList = document.querySelector('#taskList');
const emptyState = document.querySelector('#emptyState');
const remainingCount = document.querySelector('#remainingCount');
const clearCompleted = document.querySelector('#clearCompleted');
const themeToggle = document.querySelector('#themeToggle');
const themeLabel = document.querySelector('#themeLabel');
const themeIcon = document.querySelector('.theme-icon');
const filterButtons = document.querySelectorAll('.filter-button');

let tasks = loadTasks();
let activeFilter = 'all';
let editingTaskId = null;

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);
  return savedTasks ? JSON.parse(savedTasks) : [];
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(title) {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: Date.now(),
  };
}

function getVisibleTasks() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'active' && !task.completed) ||
      (activeFilter === 'completed' && task.completed);
    const matchesSearch = task.title.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  taskList.innerHTML = '';

  visibleTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' completed' : ''}`;
    item.dataset.id = task.id;

    if (editingTaskId === task.id) {
      item.innerHTML = `
        <input class="edit-input" value="${escapeHtml(task.title)}" maxlength="120" aria-label="Edit task" />
        <button class="icon-button save" type="button" aria-label="Save task">✓</button>
        <button class="icon-button cancel" type="button" aria-label="Cancel editing">×</button>
      `;
    } else {
      item.innerHTML = `
        <button class="task-checkbox" type="button" aria-label="${task.completed ? 'Mark active' : 'Mark complete'}">${task.completed ? '✓' : ''}</button>
        <span class="task-text">${escapeHtml(task.title)}</span>
        <div class="task-actions">
          <button class="icon-button edit" type="button" aria-label="Edit task">✎</button>
          <button class="icon-button delete" type="button" aria-label="Delete task">⌫</button>
        </div>
      `;
    }

    taskList.appendChild(item);
  });

  const remaining = tasks.filter((task) => !task.completed).length;
  remainingCount.textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'} remaining`;
  emptyState.classList.toggle('visible', visibleTasks.length === 0);
  clearCompleted.disabled = !tasks.some((task) => task.completed);

  const editInput = taskList.querySelector('.edit-input');
  if (editInput) {
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

function updateTask(id, updates) {
  tasks = tasks.map((task) => (task.id === id ? { ...task, ...updates } : task));
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function finishEditing(id) {
  const editInput = taskList.querySelector(`[data-id="${id}"] .edit-input`);
  const nextTitle = editInput.value.trim();

  if (nextTitle) {
    editingTaskId = null;
    updateTask(id, { title: nextTitle });
  }
}

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark', isDark);
  themeLabel.textContent = isDark ? 'Light' : 'Dark';
  themeIcon.textContent = isDark ? '☀' : '☾';
  themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  localStorage.setItem(THEME_KEY, theme);
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();

  if (!title) {
    return;
  }

  tasks = [createTask(title), ...tasks];
  taskInput.value = '';
  saveTasks();
  renderTasks();
  submitButton.textContent = 'Added!';
  setTimeout(() => {
    submitButton.textContent = 'Add task';
  }, 800);
});

taskList.addEventListener('click', (event) => {
  const item = event.target.closest('.task-item');
  if (!item) return;

  const { id } = item.dataset;
  const task = tasks.find((currentTask) => currentTask.id === id);

  if (event.target.closest('.task-checkbox')) {
    updateTask(id, { completed: !task.completed });
  }

  if (event.target.closest('.edit')) {
    editingTaskId = id;
    renderTasks();
  }

  if (event.target.closest('.delete')) {
    deleteTask(id);
  }

  if (event.target.closest('.save')) {
    finishEditing(id);
  }

  if (event.target.closest('.cancel')) {
    editingTaskId = null;
    renderTasks();
  }
});

taskList.addEventListener('keydown', (event) => {
  const item = event.target.closest('.task-item');
  if (!item || !event.target.matches('.edit-input')) return;

  if (event.key === 'Enter') {
    finishEditing(item.dataset.id);
  }

  if (event.key === 'Escape') {
    editingTaskId = null;
    renderTasks();
  }
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => filterButton.classList.remove('active'));
    button.classList.add('active');
    renderTasks();
  });
});

searchInput.addEventListener('input', renderTasks);

clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

themeToggle.addEventListener('click', () => {
  const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  setTheme(nextTheme);
});

setTheme(localStorage.getItem(THEME_KEY) || 'light');
renderTasks();
