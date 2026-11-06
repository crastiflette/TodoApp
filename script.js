'use strict';

/* ==========================================================================
   Constantes & éléments du DOM
   ========================================================================== */

const STORAGE_KEY = 'tasks';          // même clé qu'avant : les anciennes tâches sont conservées
const FILTER_KEY = 'tasks-filter';
const NO_DATE = '';

const $ = (selector) => document.querySelector(selector);

const els = {
    form: $('#addForm'),
    input: $('#taskInput'),
    date: $('#dateInput'),
    list: $('#taskList'),
    counter: $('#counter'),
    empty: $('#emptyState'),
    clearCompleted: $('#clearCompleted'),
    filters: document.querySelectorAll('.filter'),
    today: $('#today'),
    template: $('#taskTemplate'),
    toast: $('#toast'),
    toastMessage: $('#toastMessage'),
    toastUndo: $('#toastUndo'),
};

/* ==========================================================================
   Utilitaires de date (en heure locale, pas en UTC)
   ========================================================================== */

const pad = (n) => String(n).padStart(2, '0');

const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseISODate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const todayISO = () => toISODate(new Date());

const addDays = (iso, days) => {
    const d = parseISODate(iso);
    d.setDate(d.getDate() + days);
    return toISODate(d);
};

const isValidISODate = (value) =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseISODate(value).getTime());

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const formatGroupLabel = (iso) => {
    if (iso === NO_DATE) return 'Sans date';
    const today = todayISO();
    if (iso === today) return "Aujourd'hui";
    if (iso === addDays(today, 1)) return 'Demain';
    if (iso === addDays(today, -1)) return 'Hier';

    const date = parseISODate(iso);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    if (date.getFullYear() !== new Date().getFullYear()) options.year = 'numeric';
    return capitalize(new Intl.DateTimeFormat('fr-FR', options).format(date));
};

/* ==========================================================================
   Stockage
   ========================================================================== */

const createId = () =>
    (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

// Valide et normalise une tâche (gère aussi les anciennes données, ex. id numérique)
const normalizeTask = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const text = typeof raw.text === 'string' ? raw.text.trim() : '';
    if (!text) return null;
    return {
        id: raw.id != null ? String(raw.id) : createId(),
        text,
        date: isValidISODate(raw.date) ? raw.date : NO_DATE,
        completed: Boolean(raw.completed),
    };
};

const loadTasks = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? parsed.map(normalizeTask).filter(Boolean) : [];
    } catch {
        return [];
    }
};

const saveTasks = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (error) {
        showToast("Impossible d'enregistrer les tâches sur cet appareil.");
        console.error(error);
    }
};

const loadFilter = () => {
    try {
        const value = localStorage.getItem(FILTER_KEY);
        return ['all', 'active', 'completed'].includes(value) ? value : 'all';
    } catch {
        return 'all';
    }
};

/* ==========================================================================
   État de l'application (source de vérité unique)
   ========================================================================== */

const state = {
    tasks: loadTasks(),
    filter: loadFilter(),
    editingId: null,
    undoSnapshot: null,
};

const findTask = (id) => state.tasks.find((t) => t.id === id);

// Toute modification passe par ici : sauvegarde + rafraîchit l'affichage
const commit = () => {
    saveTasks();
    render();
};

const addTask = (text, date) => {
    state.tasks.push({ id: createId(), text, date, completed: false });
    commit();
};

const toggleTask = (id) => {
    const task = findTask(id);
    if (!task) return;
    task.completed = !task.completed;
    commit();
};

const updateTaskText = (id, text) => {
    const task = findTask(id);
    if (!task) return;
    const trimmed = text.trim();
    if (!trimmed) {
        deleteTask(id);
        return;
    }
    task.text = trimmed;
    commit();
};

const deleteTask = (id) => {
    const task = findTask(id);
    if (!task) return;
    rememberForUndo();
    state.tasks = state.tasks.filter((t) => t.id !== id);
    commit();
    showToast(`« ${truncate(task.text, 30)} » supprimée`, true);
};

const clearCompleted = () => {
    const count = state.tasks.filter((t) => t.completed).length;
    if (count === 0) return;
    rememberForUndo();
    state.tasks = state.tasks.filter((t) => !t.completed);
    commit();
    showToast(`${count} tâche${count > 1 ? 's' : ''} effacée${count > 1 ? 's' : ''}`, true);
};

// Déplace une tâche (glisser-déposer) : nouvelle date + position avant `beforeId`
const moveTask = (id, newDate, beforeId, afterId) => {
    const index = state.tasks.findIndex((t) => t.id === id);
    if (index === -1) return;
    const [task] = state.tasks.splice(index, 1);
    task.date = newDate;

    let target = state.tasks.length;
    if (beforeId) {
        target = state.tasks.findIndex((t) => t.id === beforeId);
    } else if (afterId) {
        target = state.tasks.findIndex((t) => t.id === afterId) + 1;
    }
    state.tasks.splice(target < 0 ? state.tasks.length : target, 0, task);
    commit();
};

const setFilter = (filter) => {
    state.filter = filter;
    try { localStorage.setItem(FILTER_KEY, filter); } catch { /* préférence non critique */ }
    render();
};

/* --- Annulation --- */

const rememberForUndo = () => {
    state.undoSnapshot = state.tasks.map((t) => ({ ...t }));
};

const undo = () => {
    if (!state.undoSnapshot) return;
    state.tasks = state.undoSnapshot;
    state.undoSnapshot = null;
    hideToast();
    commit();
};

/* ==========================================================================
   Affichage
   ========================================================================== */

const truncate = (s, max) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

const matchesFilter = (task) => {
    if (state.filter === 'active') return !task.completed;
    if (state.filter === 'completed') return task.completed;
    return true;
};

// Regroupe par date, dates triées croissantes, « Sans date » à la fin
const groupByDate = (tasks) => {
    const groups = new Map();
    tasks.forEach((task) => {
        if (!groups.has(task.date)) groups.set(task.date, []);
        groups.get(task.date).push(task);
    });
    return [...groups.entries()].sort(([a], [b]) => {
        if (a === NO_DATE) return 1;
        if (b === NO_DATE) return -1;
        return a.localeCompare(b);
    });
};

const createTaskElement = (task) => {
    const item = els.template.content.firstElementChild.cloneNode(true);
    const checkbox = item.querySelector('.task-checkbox');
    const text = item.querySelector('.task-text');

    item.dataset.id = task.id;
    item.classList.toggle('completed', task.completed);

    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Marquer « ${task.text} » comme ${task.completed ? 'à faire' : 'terminée'}`);

    item.querySelector('.edit-btn').setAttribute('aria-label', `Modifier « ${task.text} »`);
    item.querySelector('.delete-btn').setAttribute('aria-label', `Supprimer « ${task.text} »`);

    if (state.editingId === task.id) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit';
        input.value = task.text;
        input.maxLength = 200;
        input.setAttribute('aria-label', 'Modifier la tâche');
        text.replaceWith(input);
    } else {
        text.textContent = task.text; // textContent : aucun risque d'injection HTML
    }

    return item;
};

let sortables = [];

const render = () => {
    const today = todayISO();
    const visible = state.tasks.filter(matchesFilter);

    sortables.forEach((s) => s.destroy());
    sortables = [];

    const fragment = document.createDocumentFragment();

    groupByDate(visible).forEach(([date, tasks]) => {
        const section = document.createElement('section');
        section.className = 'task-group';

        const isOverdue = date !== NO_DATE && date < today && tasks.some((t) => !t.completed);
        section.classList.toggle('is-overdue', isOverdue);
        section.classList.toggle('is-today', date === today);

        const heading = document.createElement('h3');
        heading.className = 'group-title';
        heading.textContent = formatGroupLabel(date);
        if (isOverdue) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = 'En retard';
            heading.append(' ', badge);
        }

        const list = document.createElement('ul');
        list.className = 'group-list';
        list.dataset.date = date;
        tasks.forEach((task) => list.appendChild(createTaskElement(task)));

        section.append(heading, list);
        fragment.appendChild(section);
    });

    els.list.replaceChildren(fragment);
    initSortable();

    // Compteur
    const remaining = state.tasks.filter((t) => !t.completed).length;
    const completed = state.tasks.length - remaining;
    els.counter.textContent = state.tasks.length === 0
        ? ''
        : `${remaining} restante${remaining > 1 ? 's' : ''} · ${completed} terminée${completed > 1 ? 's' : ''}`;

    els.clearCompleted.disabled = completed === 0;

    // Filtres
    els.filters.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.filter === state.filter)));

    // État vide
    const emptyMessages = {
        all: 'Aucune tâche pour le moment. Ajoutez-en une ci-dessus ✨',
        active: 'Tout est fait, bravo ! 🎉',
        completed: 'Aucune tâche terminée pour le moment.',
    };
    els.empty.hidden = visible.length > 0;
    els.empty.textContent = emptyMessages[state.filter];

    // Focus sur le champ d'édition si besoin
    if (state.editingId) {
        const input = els.list.querySelector('.task-edit');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }
};

const initSortable = () => {
    if (typeof Sortable === 'undefined') return; // le glisser-déposer reste optionnel
    els.list.querySelectorAll('.group-list').forEach((list) => {
        sortables.push(Sortable.create(list, {
            group: 'tasks',
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'is-ghost',
            chosenClass: 'is-chosen',
            onEnd: (event) => {
                const item = event.item;
                const next = item.nextElementSibling;
                const prev = item.previousElementSibling;
                if (event.from === event.to && event.oldIndex === event.newIndex) return;
                moveTask(item.dataset.id, event.to.dataset.date, next?.dataset.id, prev?.dataset.id);
            },
        }));
    });
};

/* --- Notification (toast) --- */

let toastTimer;

const showToast = (message, withUndo = false) => {
    els.toastMessage.textContent = message;
    els.toastUndo.hidden = !withUndo;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5000);
};

const hideToast = () => {
    els.toast.hidden = true;
    state.undoSnapshot = null;
};

/* --- Édition --- */

const startEditing = (id) => {
    state.editingId = id;
    render();
};

const stopEditing = (save) => {
    const id = state.editingId;
    if (!id) return;
    const input = els.list.querySelector('.task-edit');
    state.editingId = null;
    if (save && input) {
        updateTaskText(id, input.value);
    } else {
        render();
    }
};

/* ==========================================================================
   Événements (délégation : un seul écouteur pour toute la liste)
   ========================================================================== */

const getTaskId = (target) => target.closest('.task-item')?.dataset.id;

els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = els.input.value.trim();
    if (!text) return;
    addTask(text, els.date.value || NO_DATE);
    els.form.reset();
    els.date.value = todayISO();
    els.input.focus();
});

els.list.addEventListener('change', (event) => {
    if (event.target.matches('.task-checkbox')) toggleTask(getTaskId(event.target));
});

els.list.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = getTaskId(button);
    if (button.classList.contains('delete-btn')) deleteTask(id);
    if (button.classList.contains('edit-btn')) startEditing(id);
});

els.list.addEventListener('dblclick', (event) => {
    if (event.target.matches('.task-text')) startEditing(getTaskId(event.target));
});

els.list.addEventListener('keydown', (event) => {
    if (!event.target.matches('.task-edit')) return;
    if (event.key === 'Enter') stopEditing(true);
    if (event.key === 'Escape') stopEditing(false);
});

// focusout remonte (contrairement à blur) : on valide l'édition en quittant le champ
els.list.addEventListener('focusout', (event) => {
    if (event.target.matches('.task-edit') && state.editingId) stopEditing(true);
});

els.filters.forEach((btn) => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
els.clearCompleted.addEventListener('click', clearCompleted);
els.toastUndo.addEventListener('click', undo);

// Synchronise si l'app est ouverte dans plusieurs onglets
window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    state.tasks = loadTasks();
    render();
});

/* ==========================================================================
   Démarrage
   ========================================================================== */

els.date.value = todayISO();
els.today.textContent = capitalize(
    new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
);
render();

if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((error) => console.warn('Service worker :', error));
    });
}
