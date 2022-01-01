import base64
import json
import os
from flask import send_file, Flask, jsonify, request
from google.cloud import texttospeech

os.environ["GOOGLE_APPLICATION_CREDENTIALS"]="/path/to/your/key.json"

client = texttospeech.TextToSpeechClient()


app=Flask(__name__,static_folder="res")

@app.route("/list_voices/<lang>")
def list_voices(lang):
    """Lists the available voices."""
    # Performs the list voices request
    try:
        voices = client.list_voices(language_code=lang)
        output=[]
        for voice in voices.voices:
            output.append(dict(name=voice.name,gender=voice.ssml_gender))
        return jsonify(voices=output)
    except Exception as e:
        print("ERROR IN LIST_VOICES: %s" % (e))
        return str(e),500

@app.route("/speak",methods=["POST"])
def speak():
    req=json.loads(request.get_data(as_text=True))

    try:

        input_text = texttospeech.SynthesisInput(ssml=req["input"]["ssml"].replace("\t"," "))

        voice_name=str(req["voice"]["name"])
        lang_code="-".join(voice_name.split("-")[0:2])

        voice = texttospeech.VoiceSelectionParams(
            language_code=lang_code,
            name=voice_name
        )

        audio_enc=str(req["audioConfig"]["audioEncoding"])
        if "ogg" in audio_enc.lower():
            tts_audio_enc=texttospeech.AudioEncoding.OGG_OPUS
        elif "mp3" in audio_enc.lower():
            tts_audio_enc=texttospeech.AudioEncoding.MP3
        elif "wav" in audio_enc.lower():
            tts_audio_enc=texttospeech.AudioEncoding.LINEAR16

        audio_config = texttospeech.AudioConfig(
            audio_encoding=tts_audio_enc,speaking_rate=req["audioConfig"]["speakingRate"],pitch=req["audioConfig"]["pitch"] if "pitch" in req["audioConfig"] else 0
        )

        response = client.synthesize_speech(
            input=input_text, voice=voice, audio_config=audio_config
        )

        output=str(base64.b64encode(response.audio_content),"utf-8")

        return output
    except Exception as e:
        print("ERROR IN SYNTHESIZING: %s"%(e))
        return str(e),501


@app.route("/")
def listening():
    return app.send_static_file("html/nnzk.2.0.html")

if __name__ == '__main__':
    app.run()
