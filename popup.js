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

// Pomodoro Timer Variables
let timerRunning = false;
let timerMinutes = 25;
let timerSeconds = 0;
let timerInterval;

// DOM Elements
const setMinutesInput = document.getElementById("setMinutes");
const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const startButton = document.getElementById("startTimer");
const pauseButton = document.getElementById("pauseTimer");
const resetButton = document.getElementById("resetTimer");

// Load timer state when popup opens
loadFromStorage("pomodoro", (data) => {
    if (data) {
        timerMinutes = data.minutes;
        timerSeconds = data.seconds;
        timerRunning = data.running;
        updateTimerDisplay();
    }
});

// Set Custom Timer Duration
setMinutesInput.addEventListener("change", function () {
    if (!timerRunning) {
        // Get the user input value for minutes
        timerMinutes = parseInt(setMinutesInput.value) || 25;
        timerSeconds = 0; // Reset seconds to 0 when minutes are changed

        // Update the timer display immediately
        updateTimerDisplay();
    }
});

// Start Timer
startButton.addEventListener("click", function () {
    if (!timerRunning) {
        timerRunning = true;
        saveTimerState();
        chrome.runtime.sendMessage({ action: "startTimer", minutes: timerMinutes });
    }
});

// Pause/Resume Timer
pauseButton.addEventListener("click", function () {
    if (timerRunning) {
        timerRunning = false;
        pauseButton.textContent = "Resume"; // Change button text to Resume
        chrome.runtime.sendMessage({ action: "pauseTimer" });
    } else {
        timerRunning = true;
        pauseButton.textContent = "Pause"; // Change button text back to Pause
        chrome.runtime.sendMessage({ action: "resumeTimer" });
    }
    saveTimerState();
});

// Reset Timer
resetButton.addEventListener("click", function () {
    timerRunning = false;
    timerMinutes = parseInt(setMinutesInput.value) || 25;
    timerSeconds = 0;
    pauseButton.textContent = "Pause"; // Reset button text
    chrome.runtime.sendMessage({ action: "resetTimer", minutes: timerMinutes });
    saveTimerState();
    updateTimerDisplay();
});

// Update Timer UI Display
function updateTimerDisplay() {
    minutesDisplay.textContent = timerMinutes.toString().padStart(2, "0");
    secondsDisplay.textContent = timerSeconds.toString().padStart(2, "0");
}

// Save Timer State
function saveTimerState() {
    saveToStorage("pomodoro", {
        minutes: timerMinutes,
        seconds: timerSeconds,
        running: timerRunning,
    });
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateTimer") {
        timerMinutes = message.minutes;
        timerSeconds = message.seconds;
        timerRunning = message.running;
        updateTimerDisplay();
    }
});
