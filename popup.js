// ------------------------To-Do event handlers------------------------
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
            saveTodos();
            todoInput.value = "";
        }
    });

    // Function to add/check/delete a task
    function addTodo(taskText, completed = false) {
        const listItem = document.createElement("li");
        listItem.classList.add("todo-item");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = completed;
        checkbox.addEventListener("change", saveTodos);

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

        // Save changes to list
        listItem.appendChild(checkbox);
        listItem.appendChild(taskSpan);
        listItem.appendChild(deleteButton);
        todoList.appendChild(listItem);
    }

    // Function to save tasks in Chrome Storage
    function saveTodos() {
        const tasks = [];
        document.querySelectorAll(".todo-item").forEach((item) => {
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
                data.todos.forEach((task) => addTodo(task.text, task.completed));
            }
        });
    }
});

// ------------------------Pomodoro Timer event handlers------------------------
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

// Load timer state from Chrome Storage when popup opens
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
        pauseButton.textContent = "Resume";
        chrome.runtime.sendMessage({ action: "pauseTimer" });
    } else {
        timerRunning = true;
        pauseButton.textContent = "Pause";
        chrome.runtime.sendMessage({ action: "resumeTimer" });
    }
    saveTimerState();
});

// Reset Timer
resetButton.addEventListener("click", function () {
    timerRunning = false;
    timerMinutes = parseInt(setMinutesInput.value) || 25;
    timerSeconds = 0;
    pauseButton.textContent = "Pause";
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

// ------------------------Habit Tracker event handlers------------------------
document.addEventListener("DOMContentLoaded", function () {
    const habitInput = document.getElementById("habitInput");
    const addHabitButton = document.getElementById("addHabit");
    const habitList = document.getElementById("habitList");

    // Load habits from Chrome Storage when popup opens
    chrome.storage.sync.get("habits", function (data) {
        if (data.habits) {
            data.habits.forEach((storedHabit) => {
                // Ensure streak continuity and checkbox reset
                let habit = {
                    text: storedHabit.text,
                    streak: storedHabit.streak || 0,
                    lastCompleted: storedHabit.lastCompleted || null,
                    completed: false, // Default to unchecked, will be set later
                };

                // If habit was completed today, keep it checked
                if (isToday(habit.lastCompleted)) {
                    habit.completed = true;
                }
                // If the last completion was NOT yesterday, reset streak
                else if (!isYesterday(habit.lastCompleted)) {
                    habit.streak = 0;
                }

                addHabitToUI(habit);
            });
        }
    });

    // Add new habit
    addHabitButton.addEventListener("click", function () {
        const habitText = habitInput.value.trim();
        if (habitText) {
            const newHabit = {
                text: habitText,
                streak: 0,
                lastCompleted: null,
                completed: false,
            };
            addHabitToUI(newHabit);
            saveHabits();
            habitInput.value = "";
        }
    });

    // Function to add a habit to the UI
    function addHabitToUI(habit) {
        const listItem = document.createElement("li");
        listItem.classList.add("habit-item");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = habit.completed;
        checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
                if (!isToday(habit.lastCompleted)) {
                    if (isYesterday(habit.lastCompleted)) {
                        habit.streak += 1; // Continue streak if last completed yesterday
                    } else {
                        habit.streak = habit.streak > 0 ? habit.streak : 1; // Restore streak if it was mistakenly reduced
                    }
                }
                habit.lastCompleted = getTodayDate();
            }

            // Once checked, disable the checkbox from being unchecked for the rest of the day
            if (checkbox.checked) {
                checkbox.disabled = true; // Disable unchecking
            }

            // console.log("🟢 Streak updated:", habit.streak, "Last Completed:", habit.lastCompleted);

            updateHabitDisplay(listItem, habit);
            saveHabits();
        });

        const habitText = document.createElement("span");
        habitText.classList.add("habit-text");
        habitText.textContent = habit.text;

        const streakDisplay = document.createElement("span");
        streakDisplay.classList.add("habit-streak");

        const deleteButton = document.createElement("span");
        deleteButton.textContent = "❌";
        deleteButton.classList.add("delete");
        deleteButton.addEventListener("click", function () {
            listItem.remove();
            saveHabits();
        });

        listItem.appendChild(checkbox);
        listItem.appendChild(habitText);
        listItem.appendChild(streakDisplay);
        listItem.appendChild(deleteButton);
        habitList.appendChild(listItem);

        updateHabitDisplay(listItem, habit);
    }

    function updateHabitDisplay(listItem, habit) {
        const streakDisplay = listItem.querySelector(".habit-streak");

        // Store the correct streak in the dataset for later retrieval
        listItem.dataset.streak = habit.streak;

        if (habit.streak > 0) {
            streakDisplay.innerHTML = `Streak: ${habit.streak} 🔥`;
            streakDisplay.style.color = "green";
        } else {
            streakDisplay.innerHTML = "Streak: 0";
            streakDisplay.style.color = "red";
        }
    }

    function saveHabits() {
        const habits = [];
        document.querySelectorAll(".habit-item").forEach((item) => {
            const habitText = item.querySelector(".habit-text").textContent;
            const checkbox = item.querySelector("input");

            // Retrieve the updated habit object
            const habit = {
                text: habitText,
                streak: parseInt(item.dataset.streak) || 0, // Get from dataset (stores latest value)
                lastCompleted: checkbox.checked ? getTodayDate() : null,
                completed: checkbox.checked,
            };

            habits.push(habit);
        });

        chrome.storage.sync.set({ habits: habits }, function () {
            console.log("✅ Habits saved correctly");
        });
    }

    // Utility function to get today's date (YYYY-MM-DD)
    function getTodayDate() {
        return new Date().toISOString().split("T")[0];
    }

    // Check if given date is today
    function isToday(date) {
        return date === getTodayDate();
    }

    // Check if given date is yesterday
    function isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date === yesterday.toISOString().split("T")[0];
    }
});

// ------------------------Layout Slider------------------------
document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll(".section");
    let currentIndex = 0;

    function showSection(newIndex, direction) {
        if (newIndex === currentIndex) return;

        const currentSection = sections[currentIndex];
        const nextSection = sections[newIndex];

        // Add slide-out class to current section
        currentSection.classList.add(
            direction === "next" ? "hidden-left" : "hidden-right"
        );

        setTimeout(() => {
            currentSection.classList.remove("active", "hidden-left", "hidden-right");

            // Show new section after the transition
            nextSection.classList.add("active");
            nextSection.classList.remove("hidden-left", "hidden-right");
        }, 400);

        currentIndex = newIndex;
    }

    document.getElementById("nextSection").addEventListener("click", () => {
        let nextIndex = (currentIndex + 1) % sections.length;
        showSection(nextIndex, "next");
    });

    document.getElementById("prevSection").addEventListener("click", () => {
        let prevIndex = (currentIndex - 1 + sections.length) % sections.length;
        showSection(prevIndex, "prev");
    });

    // Initialize first section
    sections[currentIndex].classList.add("active");
});