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
    document.querySelectorAll('.task-group').forEach(group => {
        group.querySelectorAll('.task-item').forEach(item => {
            tasks.push({
                id: item.dataset.id,
                text: item.querySelector('.task-text').innerText,
                date: item.dataset.date,
                completed: item.classList.contains('completed')
            });
        });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Crée l'élément HTML d'une tâche
const createTaskElement = (task, parent = taskList) => {
    const taskItem = document.createElement('div');
    const checkbox = document.createElement('input');
    const text = document.createElement('span');
    const deleteBtn = document.createElement('button');

    taskItem.classList.add('task-item');
    taskItem.dataset.id = task.id;
    taskItem.dataset.date = task.date;
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
        loadTasks(); // recharge pour trier
    });

    taskItem.appendChild(checkbox);
    taskItem.appendChild(text);
    taskItem.appendChild(deleteBtn);
    parent.appendChild(taskItem);
};

// Charge les tâches depuis le localStorage au démarrage
const loadTasks = () => {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    document.querySelectorAll('.task-item').forEach(item => item.remove());
    document.querySelectorAll('.dateTitle').forEach(item => item.remove());
    document.querySelectorAll('.task-group').forEach(item => item.remove());

    tasks.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    });

    const groupes = {};

    tasks.forEach(task => {
        if (!groupes[task.date]) {
            groupes[task.date] = []; // crée le groupe si il n'existe pas
        }
        groupes[task.date].push(task); // ajoute la tâche dans son groupe
    });
    console.log(groupes);

    for (let i = 0; i < Object.keys(groupes).length; i++) {
        const date = Object.keys(groupes)[i];
        const dateTitle = document.createElement('h3');
        const taskGroup = document.createElement('div');

        dateTitle.classList.add('dateTitle');
        dateTitle.innerText = date;

        taskGroup.classList.add('task-group');

        taskList.appendChild(dateTitle);
        taskList.appendChild(taskGroup);
        groupes[date].forEach(task => createTaskElement(task, taskGroup));

        // ← ajoute ça
        Sortable.create(taskGroup, {
            animation: 150,
            onEnd: () => saveTasks()
        });
    }
    
};

// Ajoute une tâche
addTaskButton.addEventListener('click', () => {
    if (taskInput.value.trim() !== '') {
        // Récupère les tâches existantes
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        
        // Ajoute la nouvelle tâche
        tasks.push({
            id: Date.now(),
            text: taskInput.value.trim(),
            date: dateInput.value,
            completed: false
        });
        
        // Sauvegarde et recharge
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTasks();
        taskInput.value = '';
    }
});

// Lance le chargement au démarrage
loadTasks();
