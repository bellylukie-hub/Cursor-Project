const COLORS = ["#3d8b7a", "#d4a35a", "#6b8fd4", "#c46b8b", "#8fbf5a", "#c48b5a", "#7a6bc4", "#5ab0bf"];

const state = {
  speakers: [],
  activeSpeakerId: null,
  segments: [],
  mode: "live",
  listening: false,
  recognition: null,
  selectedSegIds: new Set(),
  mediaUrl: null,
  mediaFile: null,
  whisper: null,
  whisperModelId: null,
};

const $ = (id) => document.getElementById(id);

function uid() {
  return "s_" + Math.random().toString(36).slice(2, 9);
}

function fmtTime(sec) {
  if (sec == null || Number.isNaN(sec)) return "—";
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}.${ms}`;
}

function speakerById(id) {
  return state.speakers.find((s) => s.id === id) || null;
}

function nextColor() {
  return COLORS[state.speakers.length % COLORS.length];
}

function saveLocal() {
  localStorage.setItem(
    "voicescript_speakers",
    JSON.stringify(state.speakers.map(({ id, name, color }) => ({ id, name, color })))
  );
}

function loadLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem("voicescript_speakers") || "[]");
    if (Array.isArray(raw) && raw.length) {
      state.speakers = raw;
      state.activeSpeakerId = raw[0].id;
    }
  } catch (_) {}
}

function renderSpeakers() {
  const list = $("speakerList");
  const select = $("activeSpeaker");
  list.innerHTML = "";
  select.innerHTML = "";

  if (!state.speakers.length) {
    list.innerHTML = `<li class="hint">No speakers yet. Click + Add.</li>`;
    select.innerHTML = `<option value="">— add a speaker —</option>`;
    return;
  }

  const counts = {};
  state.segments.forEach((seg) => {
    counts[seg.speakerId] = (counts[seg.speakerId] || 0) + 1;
  });

  state.speakers.forEach((sp) => {
    const li = document.createElement("li");
    li.className = "speaker-item" + (sp.id === state.activeSpeakerId ? " active-row" : "");
    li.style.setProperty("--swatch", sp.color);
    li.innerHTML = `
      <span class="swatch" style="background:${sp.color}"></span>
      <span class="name"></span>
      <span class="count">${counts[sp.id] || 0} lines</span>
      <button type="button" class="icon-btn" title="Remove" data-del="${sp.id}">✕</button>
    `;
    li.querySelector(".name").textContent = sp.name;
    li.addEventListener("click", (e) => {
      if (e.target.closest("[data-del]")) return;
      state.activeSpeakerId = sp.id;
      renderSpeakers();
    });
    li.querySelector("[data-del]").addEventListener("click", () => {
      state.speakers = state.speakers.filter((s) => s.id !== sp.id);
      if (state.activeSpeakerId === sp.id) {
        state.activeSpeakerId = state.speakers[0]?.id || null;
      }
      saveLocal();
      renderSpeakers();
      renderTranscript();
    });
    list.appendChild(li);

    const opt = document.createElement("option");
    opt.value = sp.id;
    opt.textContent = sp.name;
    if (sp.id === state.activeSpeakerId) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderTranscript() {
  const box = $("transcript");
  const empty = $("emptyState");
  box.innerHTML = "";
  empty.classList.toggle("hidden", state.segments.length > 0);
  $("btnAssignSelected").disabled = state.selectedSegIds.size === 0 || !state.activeSpeakerId;

  state.segments.forEach((seg) => {
    const sp = speakerById(seg.speakerId);
    const el = document.createElement("article");
    el.className = "seg" + (state.selectedSegIds.has(seg.id) ? " selected" : "");
    el.style.setProperty("--seg-color", sp?.color || "#888");
    el.dataset.id = seg.id;
    el.innerHTML = `
      <div class="who"></div>
      <div class="text"></div>
      <div class="meta"></div>
    `;
    el.querySelector(".who").textContent = sp?.name || "Unassigned";
    el.querySelector(".text").textContent = seg.text;
    const timeLabel =
      seg.start != null ? `${fmtTime(seg.start)}–${fmtTime(seg.end ?? seg.start)}` : seg.source || "live";
    el.querySelector(".meta").textContent = timeLabel;
    el.addEventListener("click", (e) => {
      if (e.shiftKey) {
        if (state.selectedSegIds.has(seg.id)) state.selectedSegIds.delete(seg.id);
        else state.selectedSegIds.add(seg.id);
      } else {
        state.selectedSegIds.clear();
        state.selectedSegIds.add(seg.id);
      }
      renderTranscript();
    });
    el.addEventListener("dblclick", () => {
      if (!state.activeSpeakerId) return;
      seg.speakerId = state.activeSpeakerId;
      renderSpeakers();
      renderTranscript();
    });
    box.appendChild(el);
  });
}

function addSegment({ text, speakerId, start = null, end = null, source = "live" }) {
  const cleaned = (text || "").trim();
  if (!cleaned) return;
  state.segments.push({
    id: uid(),
    text: cleaned,
    speakerId: speakerId || state.activeSpeakerId || null,
    start,
    end,
    source,
  });
  renderSpeakers();
  renderTranscript();
}

/* ---------- Speakers UI ---------- */
$("btnAddSpeaker").addEventListener("click", () => {
  $("speakerForm").hidden = false;
  $("speakerName").value = "";
  $("speakerColor").value = nextColor();
  $("speakerName").focus();
});
$("btnCancelSpeaker").addEventListener("click", () => {
  $("speakerForm").hidden = true;
});
$("speakerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("speakerName").value.trim();
  if (!name) return;
  const sp = { id: uid(), name, color: $("speakerColor").value || nextColor() };
  state.speakers.push(sp);
  state.activeSpeakerId = sp.id;
  $("speakerForm").hidden = true;
  saveLocal();
  renderSpeakers();
});
$("activeSpeaker").addEventListener("change", (e) => {
  state.activeSpeakerId = e.target.value || null;
  renderSpeakers();
});
$("btnDemoSpeakers").addEventListener("click", () => {
  if (state.speakers.length) return;
  state.speakers = [
    { id: uid(), name: "Speaker A", color: COLORS[0] },
    { id: uid(), name: "Speaker B", color: COLORS[1] },
  ];
  state.activeSpeakerId = state.speakers[0].id;
  saveLocal();
  renderSpeakers();
});
$("btnScrollWork").addEventListener("click", () => {
  $("workspace").scrollIntoView({ behavior: "smooth" });
});

/* ---------- Mode tabs ---------- */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.mode = tab.dataset.mode;
    $("modeLive").classList.toggle("active", state.mode === "live");
    $("modeFile").classList.toggle("active", state.mode === "file");
    if (state.mode !== "live" && state.listening) stopMic();
  });
});

/* ---------- Wave viz ---------- */
function buildWave() {
  const wave = $("waveViz");
  wave.innerHTML = "";
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.style.animationDelay = `${(i % 7) * 0.08}s`;
    s.style.height = `${30 + (i % 5) * 12}%`;
    wave.appendChild(s);
  }
}
buildWave();

/* ---------- Live recognition ---------- */
function getRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  return rec;
}

function startMic() {
  if (!state.speakers.length) {
    alert("Add at least one speaker first, then choose the active person.");
    return;
  }
  if (!state.activeSpeakerId) {
    alert("Select the active speaker (voice → person).");
    return;
  }
  const rec = getRecognition();
  if (!rec) {
    $("liveStatus").textContent =
      "Speech Recognition is not supported in this browser. Use Chrome or Edge for live mode.";
    return;
  }
  state.recognition = rec;
  rec.lang = $("liveLang").value || "en-US";

  rec.onstart = () => {
    state.listening = true;
    $("btnMic").disabled = true;
    $("btnStopMic").disabled = false;
    $("waveViz").classList.add("live");
    const sp = speakerById(state.activeSpeakerId);
    $("liveStatus").textContent = `Listening… linked to ${sp?.name || "speaker"}. Switch active speaker anytime.`;
  };
  rec.onerror = (ev) => {
    $("liveStatus").textContent = `Mic error: ${ev.error}. Check microphone permission.`;
  };
  rec.onend = () => {
    if (state.listening) {
      try {
        rec.start();
      } catch (_) {
        stopMic();
      }
    }
  };
  rec.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const text = res[0].transcript;
      if (res.isFinal) {
        addSegment({
          text,
          speakerId: state.activeSpeakerId,
          source: "live",
        });
        $("interimBox").hidden = true;
      } else {
        interim += text;
      }
    }
    if (interim.trim()) {
      $("interimBox").hidden = false;
      const sp = speakerById(state.activeSpeakerId);
      $("interimBox").textContent = `${sp?.name || "…"}: ${interim}`;
    }
  };

  try {
    rec.start();
  } catch (err) {
    $("liveStatus").textContent = String(err.message || err);
  }
}

function stopMic() {
  state.listening = false;
  $("waveViz").classList.remove("live");
  $("btnMic").disabled = false;
  $("btnStopMic").disabled = true;
  $("interimBox").hidden = true;
  $("liveStatus").textContent = "Microphone stopped.";
  try {
    state.recognition?.stop();
  } catch (_) {}
  state.recognition = null;
}

$("btnMic").addEventListener("click", startMic);
$("btnStopMic").addEventListener("click", stopMic);

/* ---------- File upload ---------- */
function setMediaFile(file) {
  if (!file) return;
  if (state.mediaUrl) URL.revokeObjectURL(state.mediaUrl);
  state.mediaFile = file;
  state.mediaUrl = URL.createObjectURL(file);
  const player = $("mediaPlayer");
  player.src = state.mediaUrl;
  if (file.type.startsWith("audio/")) {
    player.removeAttribute("poster");
  }
  $("mediaPreview").hidden = false;
  $("dropzone").querySelector("p strong").textContent = file.name;
}

$("btnBrowse").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (e) => setMediaFile(e.target.files?.[0]));

const dz = $("dropzone");
["dragenter", "dragover"].forEach((ev) =>
  dz.addEventListener(ev, (e) => {
    e.preventDefault();
    dz.classList.add("drag");
  })
);
["dragleave", "drop"].forEach((ev) =>
  dz.addEventListener(ev, (e) => {
    e.preventDefault();
    dz.classList.remove("drag");
  })
);
dz.addEventListener("drop", (e) => {
  const file = e.dataTransfer?.files?.[0];
  setMediaFile(file);
});

async function decodeAudioFile(file) {
  const arrayBuf = await file.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));
    return audioBuf;
  } catch (err) {
    // Video containers often fail decodeAudioData — extract via ffmpeg.wasm
    await ctx.close();
    throw err;
  } finally {
    try {
      await ctx.close();
    } catch (_) {}
  }
}

async function extractAudioFromVideo(file) {
  $("fileProgressText").textContent = "Loading ffmpeg to extract audio from video…";
  const { FFmpeg } = await import("https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm");
  const { fetchFile, toBlobURL } = await import("https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/+esm");
  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) => {
    const pct = Math.min(99, Math.round((progress || 0) * 100));
    $("fileProgressBar").style.width = `${pct}%`;
    $("fileProgressText").textContent = `Extracting audio… ${pct}%`;
  });
  const base = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });
  const inputName = "input" + (file.name.match(/\.[^.]+$/)?.[0] || ".mp4");
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec(["-i", inputName, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", "out.wav"]);
  const data = await ffmpeg.readFile("out.wav");
  const wavBlob = new Blob([data.buffer], { type: "audio/wav" });
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuf = await ctx.decodeAudioData(await wavBlob.arrayBuffer());
  await ctx.close();
  return audioBuf;
}

function audioBufferToFloat32(audioBuf) {
  const targetRate = 16000;
  const offline = new OfflineAudioContext(1, Math.ceil(audioBuf.duration * targetRate), targetRate);
  const src = offline.createBufferSource();
  // mixdown to mono
  const mono = offline.createBuffer(1, audioBuf.length, audioBuf.sampleRate);
  const ch0 = mono.getChannelData(0);
  const nCh = audioBuf.numberOfChannels;
  for (let i = 0; i < audioBuf.length; i++) {
    let sum = 0;
    for (let c = 0; c < nCh; c++) sum += audioBuf.getChannelData(c)[i];
    ch0[i] = sum / nCh;
  }
  src.buffer = mono;
  src.connect(offline.destination);
  src.start(0);
  return offline.startRendering().then((rendered) => rendered.getChannelData(0));
}

async function getWhisper(modelId) {
  if (state.whisper && state.whisperModelId === modelId) return state.whisper;
  $("fileProgressText").textContent = "Loading Whisper model (first time may take a minute)…";
  $("fileProgressBar").style.width = "15%";
  const { pipeline, env } = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
  env.allowLocalModels = false;
  const transcriber = await pipeline("automatic-speech-recognition", modelId, {
    progress_callback: (p) => {
      if (p?.progress != null) {
        const pct = Math.round(p.progress);
        $("fileProgressBar").style.width = `${Math.min(90, 15 + pct * 0.6)}%`;
        $("fileProgressText").textContent = `Downloading model… ${pct}%`;
      } else if (p?.status) {
        $("fileProgressText").textContent = `${p.status}${p.file ? ": " + p.file : ""}`;
      }
    },
  });
  state.whisper = transcriber;
  state.whisperModelId = modelId;
  return transcriber;
}

$("btnTranscribeFile").addEventListener("click", async () => {
  if (!state.mediaFile) {
    alert("Choose an audio or video file first.");
    return;
  }
  if (!state.speakers.length) {
    alert("Add speakers first so you can associate each line with a person.");
    return;
  }

  $("fileProgress").hidden = false;
  $("fileProgressBar").style.width = "5%";
  $("btnTranscribeFile").disabled = true;

  try {
    let audioBuf;
    try {
      $("fileProgressText").textContent = "Decoding audio…";
      audioBuf = await decodeAudioFile(state.mediaFile);
    } catch (_) {
      $("fileProgressText").textContent = "Audio decode failed — trying video extraction…";
      audioBuf = await extractAudioFromVideo(state.mediaFile);
    }

    $("fileProgressText").textContent = "Preparing samples…";
    $("fileProgressBar").style.width = "35%";
    const samples = await audioBufferToFloat32(audioBuf);

    const modelId = $("whisperModel").value;
    const transcriber = await getWhisper(modelId);
    $("fileProgressText").textContent = "Transcribing…";
    $("fileProgressBar").style.width = "70%";

    const lang = $("fileLang").value;
    const result = await transcriber(samples, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
      ...(lang ? { language: lang, task: "transcribe" } : {}),
    });

    const chunks = result.chunks?.length
      ? result.chunks
      : [{ text: result.text, timestamp: [0, audioBuf.duration] }];

    chunks.forEach((ch, i) => {
      const text = (ch.text || "").trim();
      if (!text) return;
      const [start, end] = ch.timestamp || [null, null];
      // default: assign to active speaker; user can reassign / alternate
      const speakerId = state.activeSpeakerId || state.speakers[i % state.speakers.length]?.id;
      addSegment({
        text,
        speakerId,
        start: start ?? null,
        end: end ?? null,
        source: "file",
      });
    });

    $("fileProgressBar").style.width = "100%";
    $("fileProgressText").textContent = `Done · ${chunks.length} segment(s). Double-click a line to assign the active speaker.`;
  } catch (err) {
    console.error(err);
    $("fileProgressText").textContent = `Error: ${err.message || err}`;
    alert(
      "Could not transcribe this file.\n\nTips:\n• Prefer WAV/MP3 for audio\n• For video, keep the file under ~100MB\n• Use Chrome\n\n" +
        (err.message || "")
    );
  } finally {
    $("btnTranscribeFile").disabled = false;
  }
});

/* ---------- Assign / alternate / clear / export ---------- */
$("btnAssignSelected").addEventListener("click", () => {
  if (!state.activeSpeakerId) return;
  state.segments.forEach((seg) => {
    if (state.selectedSegIds.has(seg.id)) seg.speakerId = state.activeSpeakerId;
  });
  state.selectedSegIds.clear();
  renderSpeakers();
  renderTranscript();
});

$("btnAlternate").addEventListener("click", () => {
  if (state.speakers.length < 2) {
    alert("Need at least 2 speakers to alternate.");
    return;
  }
  const a = state.speakers[0].id;
  const b = state.speakers[1].id;
  state.segments.forEach((seg, i) => {
    seg.speakerId = i % 2 === 0 ? a : b;
  });
  renderSpeakers();
  renderTranscript();
});

$("btnClear").addEventListener("click", () => {
  if (!state.segments.length) return;
  if (!confirm("Clear the whole transcript?")) return;
  state.segments = [];
  state.selectedSegIds.clear();
  renderSpeakers();
  renderTranscript();
});

function downloadBlob(filename, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportTxt() {
  const lines = state.segments.map((seg) => {
    const sp = speakerById(seg.speakerId);
    const t = seg.start != null ? `[${fmtTime(seg.start)}] ` : "";
    return `${t}${sp?.name || "Unknown"}: ${seg.text}`;
  });
  downloadBlob("transcript.txt", lines.join("\n\n"), "text/plain");
}

function exportSrt() {
  let n = 1;
  const blocks = [];
  state.segments.forEach((seg) => {
    if (seg.start == null) return;
    const sp = speakerById(seg.speakerId);
    const start = toSrtTime(seg.start);
    const end = toSrtTime(seg.end != null ? seg.end : seg.start + 2);
    blocks.push(`${n}\n${start} --> ${end}\n${sp?.name || "Unknown"}: ${seg.text}\n`);
    n += 1;
  });
  if (!blocks.length) {
    alert("SRT export needs timed segments (from file transcription).");
    return;
  }
  downloadBlob("transcript.srt", blocks.join("\n"), "application/x-subrip");
}

function toSrtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function exportJson() {
  const payload = {
    createdAt: new Date().toISOString(),
    speakers: state.speakers,
    segments: state.segments,
  };
  downloadBlob("transcript.json", JSON.stringify(payload, null, 2), "application/json");
}

$("btnExportTxt").addEventListener("click", exportTxt);
$("btnExportSrt").addEventListener("click", exportSrt);
$("btnExportJson").addEventListener("click", exportJson);

/* ---------- init ---------- */
loadLocal();
if (!state.speakers.length) {
  // start empty on purpose
}
renderSpeakers();
renderTranscript();
