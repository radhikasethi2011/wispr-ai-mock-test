function updateStatus(message) {
    document.getElementById("status").textContent = message;
}

// Function to check if the server is running before allowing dictation
async function checkServerStatus() {
    try {
        const response = await fetch("http://127.0.0.1:5001/" , { method: "GET" , mode: "cors" });
        return response.ok;
    } catch (error) {
        console.error("Error checking server status:", error);
        return false;
    }
}

// Function to reset buttons back to initial state
function resetButtons() {
    document.getElementById("start").disabled = false;
    document.getElementById("stop").disabled = true;
}

// Function to insert text into Gmail via the content script
function insertTextIntoGmail(text) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) {
            console.error("No active tabs found");
            alert("Please open Gmail in a tab before using this extension");
            return;
        }

        chrome.tabs.sendMessage(tabs[0].id, { action: "insert_text", text }, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error inserting text:", chrome.runtime.lastError);
                chrome.scripting.executeScript({
                    target : {tabId: tabs[0].id},
                    files : ["content.js"]
                }, function () {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "insert_text", text });
                });
                return;
            }

            console.log("Inserted Response:". response);
            if (response && response.success) {
                updateStatus("Text inserted successfully!!!");
            } else {
                updateStatus("Failed to insert text");
            }
        });
    });
}

// Event listener for the "Start" button
document.getElementById("start").addEventListener("click", async () => {
    try {
        updateStatus("Checking Server...");
        const serverRunning = await checkServerStatus();

        if (!serverRunning) {
            throw new Error("Server is not running");
        }

        // Updating the UI
        document.getElementById("start").disabled = true;
        document.getElementById("stop").disabled = false;
        updateStatus("Listening...");

        chrome.runtime.sendMessage({ 
            action: "call_api", 
            url: "http://127.0.0.1:5001/start_listening",
            method: "POST" 
        }, function(response) {
            if (chrome.runtime.lastError || !response || !response.success) {
                console.error("Error starting transcription:", response?.error || chrome.runtime.lastError);
                updateStatus("Error:", (response?.error || "Failed to start the dictation"));
                resetButtons();
                return;
            }
            console.log("Transcription started successfully");
        });
    }
catch (error) {
    console.error("Error starting dictation:", error);
    updateStatus("Error:", error.message);
    resetButtons();
    }
});

// Event listener for the "Stop" button
document.getElementById("stop").addEventListener("click", async () => {
    try {
        updateStatus("Processing...");
        document.getElementById("stop").disabled = true;

        chrome.runtime.sendMessage({ 
            action: "call_api", 
            url: "http://127.0.0.1:5001/stop_listening",
            method: "POST" 
        }, function(response) {
            if (chrome.runtime.lastError || !response || !response.success) {
                console.error("Error starting transcription:", response?.error || chrome.runtime.lastError);
                updateStatus("Error:", (response?.error || "Failed to start the dictation"));
                resetButtons();
                return;
            }
            console.log("Received Transcription:", response.data);

            const transcription = response.data.text;

            if (transcription && transcription != "No speech detected!") {
                insertTextIntoGmail(transcription);
            } else {
                updateStatus("No speech detected");
                resetButtons();
            }
    });
        
    } catch (error) {
        console.error("Error stopping dictation:", error);
        updateStatus("Error:", error.message);
        resetButtons();
    }

});

// Check server status when popup is opened
document.addEventListener("DOMContentLoaded", async function() {
    updateStatus("Checking Server...");
    const serverRunning = await checkServerStatus();
    if (serverRunning) {
        updateStatus("Ready ");
    } else {
        updateStatus("Server not running");
        alert("Please start the server before using this extension");
    }

});