"""Vietnamese voice-over with VieNeu Studio (local, port 8001). Same interface as Lemo-Opuscar's core/tts/tts.py:
    python tools/tts_vieneu.py lines.json out_dir
lines.json = [{"id": "l00", "text": "Xin chào"}, ...]
Writes out_dir/<id>.wav (48 kHz mono, loudness -16 LU) and out_dir/dur.json. Needs VieNeu Studio running on :8001.
Same tempo/loudness as tools/vieneu.mjs (TEMPO env, default 1.1).
"""
import sys, json, os, subprocess, urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8')   # Windows console is cp1252 by default; Vietnamese would crash the print

if len(sys.argv) < 3 or sys.argv[1] in ('-h', '--help'):
    print(__doc__); sys.exit(0 if len(sys.argv) > 1 and sys.argv[1] in ('-h', '--help') else 2)
lines_path, out = sys.argv[1], sys.argv[2]
VOICE = os.environ.get('VIENEU_VOICE', 'Giọng Tuấn MIA')
TEMPO = os.environ.get('TEMPO', '1.1')
API = 'http://127.0.0.1:8001/api/tts'

try:
    urllib.request.urlopen('http://127.0.0.1:8001/api/health', timeout=5)
except (urllib.error.URLError, OSError):
    sys.exit('tts_vieneu.py: VieNeu Studio is not running on :8001. Start it: uv run vieneu-studio (PYTHONUTF8=1, VIENEU_PORT=8001).')

lines = json.load(open(lines_path, encoding='utf-8'))
raw = os.path.join(out, 'raw'); os.makedirs(raw, exist_ok=True)
dur = {}
for L in lines:
    rw, rt = os.path.join(raw, L['id'] + '.wav'), os.path.join(raw, L['id'] + '.txt')
    cached = os.path.exists(rw) and os.path.exists(rt) and open(rt, encoding='utf-8').read() == L['text']
    if not cached:
        body = json.dumps({'text': L['text'], 'voice': VOICE, 'speed': 1.0}).encode('utf-8')
        req = urllib.request.Request(API, data=body, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=300) as r:
            open(rw, 'wb').write(r.read())
        open(rt, 'w', encoding='utf-8').write(L['text'])
    dst = os.path.join(out, L['id'] + '.wav')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', rw, '-af', f'atempo={TEMPO},loudnorm=I=-16:TP=-1.5:LRA=11',
                    '-ar', '48000', '-ac', '1', dst], check=True)
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst],
                       capture_output=True, text=True, check=True).stdout.strip()
    dur[L['id']] = round(float(d), 3)
    print(L['id'], dur[L['id']], L['text'])
json.dump(dur, open(os.path.join(out, 'dur.json'), 'w', encoding='utf-8'), indent=1)
