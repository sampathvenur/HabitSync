// Saves any data to Chrome Storage
function saveToStorage(key, value) {
    chrome.storage.sync.set({ [key]: value });
}

// Loads data from Chrome Storage
function loadFromStorage(key, callback) {
    chrome.storage.sync.get(key, function (data) {
        callback(data[key]);
    });
}
