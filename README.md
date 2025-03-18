# Gmail Voice Dictation

A Chrome extension that adds voice dictation to Gmail using Whisper AI for speech recognition.

## Quick Start

### Setup Server
1. Install requirements
```bash
pip install -r requirements.txt
pip install --upgrade --no-deps --force-reinstall git+https://github.com/openai/whisper.git
```

2. Run the server
```bash
python server.py
```

### Install Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder

## How to Use
1. Make sure the server is running
2. Open Gmail
3. Click the "Dictate" button in the compose toolbar
4. Start speaking
5. Click "Stop" when finished

## Tech Stack
- Frontend: Chrome Extension (JavaScript)
- Backend: Flask server
- AI: Whisper (speech recognition) + DeepPunct (punctuation)

## Troubleshooting
If dictation doesn't work, check that the server is running at http://127.0.0.1:5001
