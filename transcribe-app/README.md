# VoiceScript — Transcribe audio & video by speaker

Webapp that turns **audio / video** into text and lets you **link each line to a person** (speaker association).

## Open

```bash
cd transcribe-app
python3 -m http.server 8090
```

Open http://localhost:8090  
(Or open `index.html` in Chrome / Edge.)

> File transcription loads Whisper from a CDN — serve over `http://` (not always `file://`) for best results.

## Features

1. **Live microphone** — browser Speech Recognition (Chrome / Edge)
2. **Active voice → person** — choose who is speaking; every new sentence is tagged to that speaker
3. **Upload audio or video** — on-device Whisper (Transformers.js); video audio extracted with ffmpeg.wasm when needed
4. **Re-assign lines** — click to select, double-click to assign active speaker, or auto-alternate 2 speakers
5. **Export** — TXT, SRT (timed), JSON

## How to associate text with each person

1. Click **+ Add** under Speakers → enter name + color (e.g. Nilsa, João)
2. Set **Active voice → person** to the current speaker
3. **Live:** start listening; switch the active speaker when the other person talks
4. **File:** transcribe, then double-click each line (or select + “Assign to active speaker”)
5. Optional: **Auto-alternate 2 speakers** for simple back-and-forth dialogue

## Languages

Live and file modes support Portuguese, English, French, Spanish (and more via the language dropdowns).

## Privacy

Processing runs in your browser. Media is not uploaded to our server.
