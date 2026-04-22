const addTaskButton = document.getElementById('addTaskButton');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');

addTaskButton.addEventListener('click', () => {
    if (taskInput.value.trim() !== '') {
        const taskText = taskInput.value.trim();

        const taskItem = document.createElement('div');
        const checkbox = document.createElement('input');
        const text = document.createElement('span');
        const deleteBtn = document.createElement('button');

        taskItem.classList.add('task-item');
        checkbox.type = 'checkbox';
        checkbox.classList.add('task-checkbox');
        text.classList.add('task-text');
        text.innerText = taskText;
        deleteBtn.classList.add('delete-btn');
        deleteBtn.innerText = 'x';

        checkbox.addEventListener('change', () => {
            taskItem.classList.toggle('completed');
        });

        deleteBtn.addEventListener('click', () => {
            taskItem.remove();
        });


        taskItem.appendChild(checkbox);
        taskItem.appendChild(text);
        taskItem.appendChild(deleteBtn);
        taskList.appendChild(taskItem);

        taskInput.value = '';
    }
    
});

