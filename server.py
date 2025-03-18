import numpy as np
import pandas as pd 
import os 
import json
import re
import threading
import time
import whisper
import pyaudio
from deepmultilingualpunctuation import PunctuationModel
from flask import Flask, request, jsonify
from threading import Lock
from flask_cors import CORS


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

SAMPLE_RATE = 16000
FRAMES_PER_BUFFER = 4096


print("loading reqd models")
whisper_model = whisper.load_model("small")
print("loading deep punct model")
punct_model = PunctuationModel()

#Global Variables 
processing_complete = False
listening = False
transcribed_text = ""
transcription_lock = Lock()


def speech_to_text(): #using whisper and deep punct here 
    global transcribed_text, listening

    try: 
        #initialising the mic 
        mic=pyaudio.PyAudio()

        #opening the audio stream 
        stream = mic.open(format=pyaudio.paInt16,
         channels=1, 
         rate=SAMPLE_RATE, 
         input=True, 
         frames_per_buffer=FRAMES_PER_BUFFER)
        
        stream.start_stream()
        print("Listening... Speak now.")
        audio_frames = []

        #continue collcting the audio while listening flag is se to True 
        while listening: 
            try: 
                data = stream.read(FRAMES_PER_BUFFER, exception_on_overflow=False)
                audio_frames.append(np.frombuffer(data, dtype=np.int16))
            except Exception as e:
                print(f"Error capturing audio: {e}")
                break
        
        stream.stop_stream()
        stream.close()
        mic.terminate()

        #skip proceesing if no audio is being captured
        if not audio_frames:
            return "no audio captured!"

        audio_data = np.concatenate(audio_frames, axis=0).astype(np.float32) / 32767.0

    
        if len(audio_data) < SAMPLE_RATE:
            return "audio too short!"

        #whisper model transcribe
        whisper_result = whisper_model.transcribe(audio_data, fp16=False)
        raw_text = whisper_result["text"].strip()

        if not raw_text:
            return "no speech detected!"

        #apply punctuation and capitalization
        processed_text = punct_model.restore_punctuation(raw_text)
        print("Final processed text: ", {processed_text})

        #safely update transcribed_text using the lock
        with transcription_lock:
            transcribed_text = processed_text
            global processing_complete
            processing_complete = True

    except Exception as e:
        print(f"Error processing audio: {e}")
        with transcription_lock:
            processing_complete = True
        


#endpoints

listening=False
transcribed_text = ""

@app.route("/start_listening", methods=["POST", "OPTIONS"])
def start_listening():
    global listening, transcribed_text
    if request.method == "OPTIONS":
        return "", 204

    with transcription_lock:
        transcribed_text = ""

    listening = True
    transcribed_text = ""

    threading.Thread(target=speech_to_text, daemon=True).start()
    return jsonify({"status": "success", "message": "listening started"})



@app.route("/stop_listening", methods=["POST", "OPTIOONS"])
def stop_listening():
    global listening, transcirbed_text, processing_complete

    if request.method == "OPTIONS":
        return "", 204

    if not listening: 
        with transcription_lock:
            final_text = transcribed_text.strip() if transcribed_text else "!"
        return jsonify({"status": "success", "message": "listening stopped", "text": final_text if final_test else "no speech detected!"})

    #how to stop listening? 
    listening = False
    processing_complete = False

    wait_count = 0 
    max_wait = 10

    print("waiitng for transcription processing to complete on the backend")
    
    while not processing_complete and wait_count < max_wait:
        time.sleep(0.5)
        wait_count += 1
        print("Still waiting ({wait_count}  / {max_wait})")

    
    with transcription_lock:
        final_text = transcribed_text.strip() if transcribed_text else "no speech detected!"
        transcrided_text = ""
        processing_complete = False

    print("final text: ", final_text)
    return jsonify({"status": "success", "message": "listening stopped", "text": final_text if final_text else "No speech detected!"})

@app.route("/", methods=["GET"])
def index():
    return jsonify({"status": "running", "message": "Gmail Voice Dictation Server", "whisper_model":"small"})

if __name__ == "__main__":
    print("Starting Gmail Voice Dictation Server...")
    print("using Whisper Model")

    app.run(host="127.0.0.1", port=5001, threaded=True, debug=True)







