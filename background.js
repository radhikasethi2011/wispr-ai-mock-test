// Service for background tasks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_transcription") {
        fetch("http://127.0.0.1:5001/stop_listening", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Background received transcription:", data);
            sendResponse({ success: true, text: data.text });
        })
        .catch(error => {
            console.error("Background error fetching transcription:", error);
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }

    // Handle API calls from popup
    if (request.action === "call_api") {
        fetch(request.url, {
            method: request.method || "POST",
            headers: request.headers || { 'Content-Type': 'application/json' },
            body: request.body ? JSON.stringify(request.body) : undefined
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API response:", data);
            sendResponse({ success: true, data });
        })
        .catch(error => {
            console.error("API error:", error);
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }

});

chrome.runtime.onInstalled.addListener((details) => {
    console.log("Gmail Voice Dictation extension installed or updated:", details.reason);
});