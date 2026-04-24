const addTaskButton = document.getElementById('addTaskButton');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const dateInput = document.getElementById('dateInput');


// Au lancement mettre par defaut la date actuel
const dateControl = document.querySelector('input[type="date"]')
dateControl.value = new Date().toISOString().split('T')[0];

// Sauvegarde toutes les tâches dans le localStorage
const saveTasks = () => {
    const tasks = [];
    document.querySelectorAll('.task-item').forEach(item => {
        tasks.push({
            id: item.dataset.id,
            text: item.querySelector('.task-text').innerText,
            date: item.querySelector('.task-date').innerText,
            completed: item.classList.contains('completed')
        });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Crée l'élément HTML d'une tâche
const createTaskElement = (task) => {
    const taskItem = document.createElement('div');
    const checkbox = document.createElement('input');
    const text = document.createElement('span');
    const date = document.createElement('span');
    const deleteBtn = document.createElement('button');

    taskItem.classList.add('task-item');
    taskItem.dataset.id = task.id;
    if (task.completed) taskItem.classList.add('completed');

    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = task.completed;

    text.classList.add('task-text');
    text.innerText = task.text;

    date.classList.add('task-date')
    date.innerText = task.date || ''

    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerText = 'x';

    checkbox.addEventListener('change', () => {
        taskItem.classList.toggle('completed');
        saveTasks(); // sauvegarde après chaque changement
    });

    deleteBtn.addEventListener('click', () => {
        taskItem.remove();
        saveTasks(); // sauvegarde après suppression
    });

    taskItem.appendChild(checkbox);
    taskItem.appendChild(text);
    taskItem.appendChild(date);
    taskItem.appendChild(deleteBtn);
    taskList.appendChild(taskItem);
};

// Charge les tâches depuis le localStorage au démarrage
const loadTasks = () => {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    document.querySelectorAll('.task-item').forEach(item => item.remove());

    tasks.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    });

    tasks.forEach(task => createTaskElement(task));
};

// Ajoute une tâche
addTaskButton.addEventListener('click', () => {
    if (taskInput.value.trim() !== '') {
        const task = {
            id: Date.now(),         // id unique basé sur le temps
            text: taskInput.value.trim(),
            date: dateInput.value,
            completed: false
        };
        createTaskElement(task);
        saveTasks(); // sauvegarde après ajout
        loadTasks(); // recharge pour trier
    }
});

// Lance le chargement au démarrage
loadTasks();
