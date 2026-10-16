#!/usr/bin/env python3
"""Bước 1 của chuỗi v2: tạo lời đọc cho từng dòng trong script.json.

python3 tools/make_voice.py            -> audio/voice/lineNN.wav và audio/voice/voice.json
VOICE_ENGINE=say python3 tools/make_voice.py

Máy đọc chọn theo thứ tự, hoặc ép bằng VOICE_ENGINE=openai|gemini|google|gtts|say:
  openai  gpt-4o-mini-tts, có chỉ dẫn giọng, cần OPENAI_API_KEY (tốn phí, hỏi người dùng trước)
  gemini  Gemini TTS, cần GEMINI_API_KEY hoặc GOOGLE_API_KEY (tốn phí, hỏi người dùng trước)
  google  Google Cloud TTS (Chirp 3 HD), cần GOOGLE_TTS_API_KEY (giống Clip Studio)
  gtts    Google Translate TTS, không cần khoá, cần mạng. Tách câu theo dấu phẩy để có nhịp nghỉ
  say     macOS say giọng Linh, chạy máy hoàn toàn

Trường của mỗi dòng: sub là phụ đề, say là câu cho openai hoặc gemini,
tts là danh sách [ngôn ngữ, chữ] cho gtts và say, để tên tiếng Anh đọc bằng giọng tiếng Anh.
Bước này không xếp thời gian. Xếp dòng vào cảnh là việc của tools/layout.py.
"""
import asyncio, hashlib, json, os, re, shutil, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mvlib import ff, duration, save_json  # noqa: E402

HERE = os.getcwd()
V = os.path.join(HERE, "audio", "voice")
CACHE = os.path.join(V, "_cache")
os.makedirs(CACHE, exist_ok=True)
S = json.load(open(os.path.join(HERE, "script.json"), encoding="utf-8"))
STYLE = S.get("voiceStyle", "")

TRIM = ("silenceremove=start_periods=1:start_threshold=-42dB,areverse,"
        "silenceremove=start_periods=1:start_threshold=-42dB,areverse")
POLISH = ("highpass=f=90,equalizer=f=220:t=q:w=1:g=2,equalizer=f=3500:t=q:w=1.2:g=1.5,"
          "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120")


def pick_engine():
    e = os.environ.get("VOICE_ENGINE") or S.get("voiceEngine")
    if e:
        return e
    if os.environ.get("OPENAI_API_KEY"):
        return "openai"
    if os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"):
        return "gemini"
    if os.environ.get("GOOGLE_TTS_API_KEY"):
        return "google"
    try:
        import gtts  # noqa: F401
        return "gtts"
    except ImportError:
        try:
            import edge_tts  # noqa: F401
            return "edge_tts"
        except ImportError:
            return "say"


ENGINE = pick_engine()


def synth_openai(text, raw):
    from openai import OpenAI
    r = OpenAI().audio.speech.create(model="gpt-4o-mini-tts", voice=S.get("openaiVoice", "coral"), input=text,
                                     instructions=STYLE, response_format="wav")
    open(raw, "wb").write(r.content)


def synth_gemini(text, raw):
    import wave
    from google import genai
    from google.genai import types
    c = genai.Client(api_key=os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"))
    r = c.models.generate_content(
        model=S.get("geminiModel", "gemini-2.5-flash-preview-tts"), contents=f"{STYLE}\n\n{text}",
        config=types.GenerateContentConfig(response_modalities=["AUDIO"], speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=S.get("geminiVoice", "Kore"))))))
    with wave.open(raw, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
        w.writeframes(r.candidates[0].content.parts[0].inline_data.data)


def synth_google_tts(text, raw):
    """Google Cloud TTS (Chirp 3 HD Charon) using OAuth or API key"""
    import json as _json
    import subprocess as _sub
    import base64 as _b64
    import requests as _req

    voice = S.get("googleTtsVoice", "vi-VN-Chirp3-HD-Charon")
    lang = S.get("googleTtsLang", "vi-VN")
    api_key = os.environ.get("GOOGLE_TTS_API_KEY", "")
    gcloud_path = os.environ.get("GOOGLE_TTS_GCLOUD_PATH", "")
    if not gcloud_path:
        # Default path for Windows
        import platform
        if platform.system() == "Windows":
            gcloud_path = os.path.join(
                os.environ.get("LOCALAPPDATA", r"C:\Users\PHANMINHTUAN\AppData\Local"),
                "Google", "Cloud SDK", "google-cloud-sdk", "bin", "gcloud.cmd"
            )
    gcloud_project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")

    # Build payload
    payload = {
        "input": {"text": text},
        "voice": {"languageCode": lang, "name": voice},
        "audioConfig": {"audioEncoding": "MP3", "pitch": 0.0, "speakingRate": 1.0}
    }

    if api_key:
        # Use API key
        url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}"
        r = _req.post(url, json=payload, timeout=60)
    elif gcloud_path:
        # Use gcloud OAuth
        # Get access token
        token_result = _sub.run(
            [gcloud_path, "auth", "print-access-token"],
            capture_output=True, text=True
        )
        token = token_result.stdout.strip()
        if not token:
            raise RuntimeError("gcloud auth failed - run: gcloud auth login")
        url = "https://texttospeech.googleapis.com/v1/text:synthesize"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        if gcloud_project:
            headers["x-goog-user-project"] = gcloud_project
        r = _req.post(url, headers=headers, json=payload, timeout=60)
    else:
        raise RuntimeError("GOOGLE_TTS_API_KEY or GOOGLE_TTS_GCLOUD_PATH required")

    r.raise_for_status()
    data = r.json()
    audio_bytes = _b64.b64decode(data["audioContent"])
    mp3 = raw + ".mp3"
    with open(mp3, "wb") as f:
        f.write(audio_bytes)
    ff("-i", mp3, "-af", f"{TRIM},aresample=48000", "-ac", "1", raw)
    os.remove(mp3)


def _piece(lang, text, out):
    if ENGINE == "say":
        voice = S.get("sayVoices", {}).get(lang, {"vi": "Linh", "en": "Samantha"}.get(lang, "Linh"))
        aiff = out + ".aiff"
        import subprocess
        subprocess.run(["say", "-v", voice, "-r", str(S.get("sayRate", 175)), "-o", aiff, text], check=True)
        ff("-i", aiff, "-af", f"{TRIM},aresample=48000", "-ac", "1", out); os.remove(aiff)
    elif ENGINE == "edge_tts":
        import edge_tts as et
        # Default to Vietnamese female voice if available
        vi_voice = S.get("edgeVoice", "vi-VN-HoaiMyNeural")
        communicate = et.Communicate(text, vi_voice)
        mp3 = out + ".mp3"
        asyncio.run(communicate.save(mp3))
        ff("-i", mp3, "-af", f"{TRIM},aresample=48000", "-ac", "1", out); os.remove(mp3)
    elif ENGINE == "google":
        synth_google_tts(text, out)
    else:
        from gtts import gTTS
        mp3 = out + ".mp3"
        gTTS(text, lang=lang).save(mp3)
        ff("-i", mp3, "-af", f"{TRIM},aresample=48000", "-ac", "1", out); os.remove(mp3)


def synth_segments(segs, raw):
    """segs: [[lang, chữ], ...]. Tách tiếp theo dấu câu, chèn khoảng nghỉ theo loại dấu để có nhịp nói."""
    if ENGINE == "edge_tts":
        # edge_tts handles full text, no need for punctuation splitting
        lang, full_text = segs[0]
        out_mp3 = raw + ".mp3"
        import edge_tts as et
        vi_voice = S.get("edgeVoice", "vi-VN-HoaiMyNeural")
        asyncio.run(et.Communicate(full_text, vi_voice).save(out_mp3))
        ff("-i", out_mp3, "-af", f"{TRIM},aresample=48000", "-ac", "1", raw)
        os.remove(out_mp3)
        return
    
    if ENGINE == "vieneu":
        # VieNeu Studio chạy trên máy (POST :8001/api/tts): đọc cả dòng một lần cho ngữ điệu liền mạch
        import urllib.request
        text = " ".join(t for _, t in segs)
        req = urllib.request.Request(S.get("vieneuUrl", "http://127.0.0.1:8001/api/tts"),
                                     data=json.dumps({"text": text, "voice": S.get("vieneuVoice", "Giọng Tuấn MIA"), "speed": 1.0}, ensure_ascii=False).encode("utf-8"),
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = r.read()
        tmp = raw + ".src.wav"
        with open(tmp, "wb") as f:
            f.write(data)
        ff("-i", tmp, "-af", f"{TRIM},aresample=48000", "-ac", "1", raw)
        os.remove(tmp)
        return

    if ENGINE == "google":
        # Google Cloud TTS handles full text
        lang, full_text = segs[0]
        synth_google_tts(full_text, raw)
        return
    
    pieces = []
    for lang, txt in segs:
        for chunk in re.findall(r"[^,.!?;:]+[,.!?;:]*", txt):
            c = chunk.strip()
            if not c:
                continue
            wv = raw + f".{len(pieces)}.wav"
            _piece(lang, c, wv)
            end = c[-1]
            pieces.append((wv, 0.30 if end in ".!?" else 0.16 if end in ",;:" else 0.06))
    seq = []
    for k, (p, pause) in enumerate(pieces):
        seq.append(p)
        if k < len(pieces) - 1:
            pad = raw + f".pad{k}.wav"
            ff("-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", str(pause), pad)
            seq.append(pad)
    args = sum((["-i", p] for p in seq), [])
    ff(*args, "-filter_complex", "".join(f"[{k}:a]" for k in range(len(seq))) + f"concat=n={len(seq)}:v=0:a=1", raw)
    for p in seq:
        os.remove(p)


SPEED = S.get("voiceSpeed", {"openai": 1.0, "gemini": 1.04, "google": 1.0, "gtts": 1.13, "edge_tts": 1.0, "say": 1.0, "vieneu": 1.1}[ENGINE])
print("máy đọc:", ENGINE, "tốc độ", SPEED)
meta = []
for i, ln in enumerate(S["lines"]):
    say = ln.get("say") or ln["sub"].replace("_", " ")
    segs = ln.get("tts") or [["vi", say]]
    spoken = say if ENGINE in ("openai", "gemini") else " ".join(t for _, t in segs)
    key = hashlib.sha1(json.dumps([ENGINE, STYLE, say, segs, S.get("openaiVoice"), S.get("geminiVoice"), S.get("sayVoices"), S.get("edgeVoice"), S.get("vieneuVoice")],
                                  ensure_ascii=False).encode()).hexdigest()[:12]
    raw = os.path.join(CACHE, f"{ENGINE}_{key}.wav")
    if not os.path.exists(raw):
        if ENGINE == "openai":
            synth_openai(say, raw)
        elif ENGINE == "gemini":
            synth_gemini(say, raw)
        else:
            synth_segments(segs, raw)
    out = os.path.join(V, f"line{i:02d}.wav")
    ff("-i", raw, "-af", f"{TRIM},atempo={SPEED},{POLISH},aresample=48000", "-ac", "1", out)
    meta.append({"i": i, "file": f"audio/voice/line{i:02d}.wav", "dur": round(duration(out), 3), "spoken": spoken})
    print(f"  line{i:02d}  {meta[-1]['dur']:.2f}s  {ln['sub'].replace('_', ' ')}")
save_json({"engine": ENGINE, "speed": SPEED, "lines": meta}, os.path.join(V, "voice.json"))
if shutil.which("say") is None and ENGINE == "say":
    sys.exit("Máy không có lệnh say.")
