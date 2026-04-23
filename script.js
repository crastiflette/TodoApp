const addTaskButton = document.getElementById('addTaskButton');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');

// Sauvegarde toutes les tâches dans le localStorage
const saveTasks = () => {
    const tasks = [];
    document.querySelectorAll('.task-item').forEach(item => {
        tasks.push({
            id: item.dataset.id,
            text: item.querySelector('.task-text').innerText,
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
    const deleteBtn = document.createElement('button');

    taskItem.classList.add('task-item');
    taskItem.dataset.id = task.id;
    if (task.completed) taskItem.classList.add('completed');

    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = task.completed;

    text.classList.add('task-text');
    text.innerText = task.text;

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
    taskItem.appendChild(deleteBtn);
    taskList.appendChild(taskItem);
};

// Charge les tâches depuis le localStorage au démarrage
const loadTasks = () => {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    document.querySelectorAll('.task-item').forEach(item => item.remove());
    tasks.forEach(task => createTaskElement(task));
};

// Ajoute une tâche
addTaskButton.addEventListener('click', () => {
    if (taskInput.value.trim() !== '') {
        const task = {
            id: Date.now(),         // id unique basé sur le temps
            text: taskInput.value.trim(),
            completed: false
        };
        createTaskElement(task);
        saveTasks(); // sauvegarde après ajout
        taskInput.value = '';
    }
});

// Lance le chargement au démarrage
loadTasks();
