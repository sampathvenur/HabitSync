document.addEventListener("DOMContentLoaded", function () {
    const todoInput = document.getElementById("todoInput");
    const addTodoButton = document.getElementById("addTodo");
    const todoList = document.getElementById("todoList");

    // Load tasks from storage
    loadTodos();

    // Add task when button is clicked
    addTodoButton.addEventListener("click", function () {
        const taskText = todoInput.value.trim();
        if (taskText) {
            addTodo(taskText);
            saveTodos(); // Save updated tasks
            todoInput.value = "";
        }
    });

    // Function to add a task
    function addTodo(taskText, completed = false) {
        const listItem = document.createElement("li");
        listItem.classList.add("todo-item");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = completed;
        checkbox.addEventListener("change", saveTodos); // Save when checkbox is checked

        const taskSpan = document.createElement("span");
        taskSpan.textContent = taskText;
        if (completed) {
            taskSpan.style.textDecoration = "line-through";
        }

        const deleteButton = document.createElement("span");
        deleteButton.textContent = "❌";
        deleteButton.classList.add("delete");
        deleteButton.addEventListener("click", function () {
            listItem.remove();
            saveTodos();
        });

        listItem.appendChild(checkbox);
        listItem.appendChild(taskSpan);
        listItem.appendChild(deleteButton);
        todoList.appendChild(listItem);
    }

    // Function to save tasks in Chrome Storage
    function saveTodos() {
        const tasks = [];
        document.querySelectorAll(".todo-item").forEach(item => {
            const taskText = item.querySelector("span").textContent;
            const completed = item.querySelector("input").checked;
            tasks.push({ text: taskText, completed });
        });

        chrome.storage.sync.set({ todos: tasks });
    }

    // Function to load tasks from Chrome Storage
    function loadTodos() {
        chrome.storage.sync.get("todos", function (data) {
            if (data.todos) {
                data.todos.forEach(task => addTodo(task.text, task.completed));
            }
        });
    }
});
