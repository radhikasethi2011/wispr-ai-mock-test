# wispr-ai-mock-test

## server.py: a flask backend, use a model for speech, and a model for punctuation, or SpaCy for Named Entity Recognition 
## manifest.json for chrome extention 
## background.js to handle background listeners? 
## content.js for handling / or for injecting UI element on the chrome page 
## popup.html: incase I want to add a popup for UI -> for start or stop 
## popup.js: interactive behaviour for popup 
## style.css -> to style the injected elements or popup 

### what does this app do? 
### runs a flask server, where we host a model to understand speech, convert to text, and then have that transcription pased in a Gmail Composer/Email. 

## pip install --upgrade --no-deps --force-reinstall git+https://github.com/openai/whisper.git
