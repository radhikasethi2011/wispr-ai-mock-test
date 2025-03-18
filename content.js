
// Function to inject the "dictate" button into Gmail's compose toolbar
function addVoiceDictationButton() {
    let toolbar = document.querySelector('.aDh');
    if (toolbar && !document.getElementById("voice-dictation-button")) {
        console.log("Found gmail toolbar, adding dictation button");

        // Create the button element
        let button = document.createElement('button');
        button.id = "voice-dictation-button";
        button.textContent = "Dictate";
        button.title = "Start voice dictation";
        button.style.marginLeft = "10px";
        button.style.padding = "6px 12px";
        button.style.backgroundColor = "#00008B";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "4px";
        button.style.cursor = "pointer";
        
        button.onmouseover = function() {
            this.style.backgroundColor = "#6082B6";
        }
        button.onmouseout = function() {
            this.style.backgroundColor = "#00008B";
        }
        button.onclick = startDictationInWindow;
        toolbar.appendChild(button);
        }
}


function updateStatusDisplay(text, display = true) {
    let statusDisplay = document.getElementById("voice-dictation-status") || document.createElement("div");
    if (!statusDisplay.id) {
        Object.assign(statusDisplay, {id : "voice-dictation-status", style: "position:fixed; bottom:20px; right:20px; padding:10px 15px; background-color:#333; color:white; border-radius:5px; z-index:9999;"});
        document.body.appendChild(statusDisplay);
    }
    statusDisplay.textContent = text;
    statusDisplay.style.display = display ? "block" : "none";
}

// Function to start dictation
async function startDictationInWindow() {
    console.log("Starting dictation...");
    try{
        updateStatusDisplay("Starting dictation...");
        let res = await fetch("http://127.0.0.1:5001/start_listening", { method: "POST", headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
            throw new Error(`Server returned ${res.status}`);
        }

        updateStatusDisplay("Listening...Click button again to Stop");
        let button = document.getElementById("voice-dictation-button");
        if (button) Object.assign(button, {textContent: "Stop", title: "Stop voice dictation", onclick: stopDictationInWindow});
    }
    catch (error) {
        console.error("Error starting dictation:", error);
        alert(`Error: ${error.message}. Ensure the server is running and try again.`);
        updateStatusDisplay("", false);
    }
    
}

// Function to stop dictation
async function stopDictationInWindow() {
    console.log("Stopping dictation...");
    try {
        updateStatusDisplay("Processing...");
        let res = await fetch("http://127.0.0.1:5001/stop_listening", { method: "POST", headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
            throw new Error(`Server returned ${res.status}`);
        }
        let { text } = await res.json();
        if (text && text !== "No Speech detected!") {
            insertTextIntoGmail(text) ? updateStatusDisplay("Text Inserted, false") : updateStatusDisplay("Could not insert text", false);
        } else updateStatusDisplay("No speech detected", false);

        let button = document.getElementById("voice-dictation-button");
        if (button) Object.assign(button, {textContent: "Dictate", title: "Start voice dictation", style: {backgroundColor: "#00008B"},  onclick: startDictationInWindow});
} catch (error) {
    console.error("Error stopping dictation:", error);
    alert(`Error: ${error.message}. Ensure the server is running and try again.`);
    updateStatusDisplay("", false);
}
}

function insertTextIntoGmail(text) {
    console.log("Inserting text into Gmail:", text);
    let selectors = ["div[aria-label='Message Body']", "div[contenteditable='true']", "div.Am.Al.editable.LW-avf", ".editable[role='textbox']"];
    let box = selectors.map(s => document.querySelector(s)).find(el => el && el.isContentEditable);

    if (box) {
        box.focus();
        try {
            if (document.execCommand("insertText", false, text + " ")) return true;
            let range = window.getSelection().getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text + " "));
            window.getSelection().collapseToEnd();
            return true;
            } catch (error) {
            console.error("Error inserting text:", error);
            return false;
        }
    } else return false;
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "insert_text") {
        sendResponse({success : insertTextIntoGmail(req.text)});
    }
});

function initializeExtension() {
    console.log("Gmail Voice Dictation Loaded");
    addVoiceDictationButton();
    new MutationObserver( () => addVoiceDictationButton()).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'complete') initializeExtension();
else {
    document.addEventListener('DOMContentLoaded', initializeExtension);
    window.addEventListener('load', initializeExtension);
}
