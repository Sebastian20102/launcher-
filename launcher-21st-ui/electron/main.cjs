const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");

let mainWindow;
const activeUsageTrackers = new Map();
const OPENAI_MODEL = process.env.NEXUS_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-5.5";
const OLLAMA_MODEL = process.env.NEXUS_OLLAMA_MODEL || "llama3.2:3b";
const OLLAMA_BASE_URL = process.env.NEXUS_OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const LM_STUDIO_MODEL = process.env.NEXUS_LM_STUDIO_MODEL || "auto";
const LM_STUDIO_BASE_URL = process.env.NEXUS_LM_STUDIO_BASE_URL || "http://127.0.0.1:1234/v1";
const AI_REQUEST_TIMEOUT_MS = Number(process.env.NEXUS_AI_TIMEOUT_MS || 22000);

app.setPath("userData", path.join(app.getPath("appData"), "Nexus Launcher"));
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

function userLibraryPath() {
  return path.join(app.getPath("userData"), "library.json");
}

function aiMemoryPath() {
  return path.join(app.getPath("userData"), "ai-memory.json");
}

function aiSettingsPath() {
  return path.join(app.getPath("userData"), "ai-settings.json");
}

function usageStatsPath() {
  return path.join(app.getPath("userData"), "usage.json");
}

function notesPath() {
  return path.join(app.getPath("userData"), "notes.json");
}

async function fetchWithTimeout(url, options = {}, timeoutMs = AI_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function isAbortError(error) {
  return error?.name === "AbortError" || /aborted|abort/i.test(String(error?.message || ""));
}

async function readAiSettings() {
  const file = aiSettingsPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (!fsSync.existsSync(file)) {
    await fs.writeFile(
      file,
      JSON.stringify(
        {
          provider: "lmstudio",
          apiKey: "",
          model: OPENAI_MODEL,
          openAiModel: OPENAI_MODEL,
          ollamaModel: OLLAMA_MODEL,
          ollamaBaseUrl: OLLAMA_BASE_URL,
          lmStudioModel: LM_STUDIO_MODEL,
          lmStudioBaseUrl: LM_STUDIO_BASE_URL,
        },
        null,
        2,
      ),
      "utf8",
    );
  }
  try {
    const raw = (await fs.readFile(file, "utf8")).replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw);
    return {
      provider: typeof parsed.provider === "string" ? parsed.provider.trim() : "lmstudio",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "",
      model: typeof parsed.model === "string" && parsed.model.trim() ? parsed.model.trim() : OPENAI_MODEL,
      openAiModel:
        typeof parsed.openAiModel === "string" && parsed.openAiModel.trim()
          ? parsed.openAiModel.trim()
          : typeof parsed.model === "string" && parsed.model.trim()
            ? parsed.model.trim()
            : OPENAI_MODEL,
      ollamaModel:
        typeof parsed.ollamaModel === "string" && parsed.ollamaModel.trim()
          ? parsed.ollamaModel.trim()
          : OLLAMA_MODEL,
      ollamaBaseUrl:
        typeof parsed.ollamaBaseUrl === "string" && parsed.ollamaBaseUrl.trim()
          ? parsed.ollamaBaseUrl.trim().replace(/\/$/, "")
          : OLLAMA_BASE_URL,
      lmStudioModel:
        typeof parsed.lmStudioModel === "string" && parsed.lmStudioModel.trim()
          ? parsed.lmStudioModel.trim()
          : LM_STUDIO_MODEL,
      lmStudioBaseUrl:
        typeof parsed.lmStudioBaseUrl === "string" && parsed.lmStudioBaseUrl.trim()
          ? parsed.lmStudioBaseUrl.trim().replace(/\/$/, "")
          : LM_STUDIO_BASE_URL,
      path: file,
    };
  } catch {
    return {
      provider: "lmstudio",
      apiKey: "",
      model: OPENAI_MODEL,
      openAiModel: OPENAI_MODEL,
      ollamaModel: OLLAMA_MODEL,
      ollamaBaseUrl: OLLAMA_BASE_URL,
      lmStudioModel: LM_STUDIO_MODEL,
      lmStudioBaseUrl: LM_STUDIO_BASE_URL,
      path: file,
    };
  }
}

async function ensureAiMemoryFile() {
  const file = aiMemoryPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (!fsSync.existsSync(file)) {
    await fs.writeFile(file, JSON.stringify({ messages: [], facts: [] }, null, 2), "utf8");
  }
  return file;
}

async function readAiMemory() {
  const file = await ensureAiMemoryFile();
  const raw = await fs.readFile(file, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages.slice(-24) : [],
      facts: Array.isArray(parsed.facts) ? parsed.facts.slice(-80) : [],
    };
  } catch {
    return { messages: [], facts: [] };
  }
}

async function writeAiMemory(memory) {
  const file = await ensureAiMemoryFile();
  const safeMemory = {
    messages: Array.isArray(memory.messages) ? memory.messages.slice(-40) : [],
    facts: Array.isArray(memory.facts) ? memory.facts.slice(-100) : [],
  };
  await fs.writeFile(file, JSON.stringify(safeMemory, null, 2), "utf8");
  return safeMemory;
}

async function readNotes() {
  const file = notesPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (!fsSync.existsSync(file)) {
    await fs.writeFile(file, "[]", "utf8");
    return [];
  }
  try {
    const raw = (await fs.readFile(file, "utf8")).replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeNotes(notes) {
  const file = notesPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const safeNotes = Array.isArray(notes)
    ? notes.map((note) => ({
        id: String(note.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
        title: String(note.title || "Nota sin titulo").slice(0, 120),
        body: String(note.body || "").slice(0, 12000),
        linkedItemId: note.linkedItemId ? String(note.linkedItemId) : "",
        pinned: Boolean(note.pinned),
        updatedAt: note.updatedAt || new Date().toISOString(),
        createdAt: note.createdAt || new Date().toISOString(),
      }))
    : [];
  await fs.writeFile(file, JSON.stringify(safeNotes, null, 2), "utf8");
  return safeNotes;
}

async function readUsageStats() {
  const file = usageStatsPath();
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeUsageStats(stats) {
  const safeStats = stats && typeof stats === "object" ? stats : {};
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(usageStatsPath(), JSON.stringify(safeStats, null, 2), "utf8");
  return safeStats;
}

function getExecutableName(targetPath) {
  if (!targetPath || typeof targetPath !== "string") return "";
  if (!/\.exe$/i.test(targetPath)) return "";
  return path.basename(targetPath);
}

function isProcessRunning(imageName) {
  if (!imageName || process.platform !== "win32") return Promise.resolve(false);
  return new Promise((resolve) => {
    execFile("tasklist", ["/FI", `IMAGENAME eq ${imageName}`, "/FO", "CSV", "/NH"], { windowsHide: true }, (error, stdout) => {
      if (error) {
        resolve(false);
        return;
      }
      resolve(stdout.toLowerCase().includes(imageName.toLowerCase()));
    });
  });
}

async function finishUsageSession(tracker, endedAt = new Date()) {
  if (!tracker || tracker.finished) return;
  tracker.finished = true;
  if (tracker.timer) clearInterval(tracker.timer);
  activeUsageTrackers.delete(tracker.itemId);

  const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - tracker.startedAt.getTime()) / 1000));
  const stats = await readUsageStats();
  const previous = stats[tracker.itemId] || {
    itemId: tracker.itemId,
    name: tracker.name,
    totalSeconds: 0,
    sessions: 0,
  };
  stats[tracker.itemId] = {
    ...previous,
    itemId: tracker.itemId,
    name: tracker.name || previous.name,
    totalSeconds: Number(previous.totalSeconds || 0) + durationSeconds,
    sessions: Number(previous.sessions || 0) + 1,
    lastStartedAt: tracker.startedAt.toISOString(),
    lastEndedAt: endedAt.toISOString(),
    lastDurationSeconds: durationSeconds,
  };
  await writeUsageStats(stats);
}

function startUsageTracking(targetPath, metadata = {}) {
  const imageName = getExecutableName(targetPath);
  const itemId = metadata?.itemId || targetPath;
  if (!imageName || !itemId || activeUsageTrackers.has(itemId)) return;

  const tracker = {
    itemId,
    name: metadata?.name || imageName,
    imageName,
    startedAt: new Date(),
    timer: null,
    checksWithoutProcess: 0,
    finished: false,
  };
  activeUsageTrackers.set(itemId, tracker);

  const poll = async () => {
    const running = await isProcessRunning(imageName);
    if (running) {
      tracker.checksWithoutProcess = 0;
      return;
    }
    tracker.checksWithoutProcess += 1;
    if (tracker.checksWithoutProcess >= 2) {
      await finishUsageSession(tracker);
    }
  };

  setTimeout(poll, 3000);
  tracker.timer = setInterval(poll, 10000);
}

async function getSystemSnapshot() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  let rootDisk = null;
  try {
    const stat = await fs.statfs(app.getPath("home"));
    rootDisk = {
      total: stat.blocks * stat.bsize,
      free: stat.bfree * stat.bsize,
      available: stat.bavail * stat.bsize,
    };
  } catch {
    rootDisk = null;
  }

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    uptimeSeconds: os.uptime(),
    cpuModel: cpus[0]?.model || "No disponible",
    cpuCores: cpus.length,
    totalMemory: totalMem,
    freeMemory: freeMem,
    usedMemory: totalMem - freeMem,
    rootDisk,
    homeDir: app.getPath("home"),
    appDataDir: app.getPath("userData"),
    capturedAt: new Date().toISOString(),
  };
}

const imageExtensions = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "ico"]);
const videoExtensions = new Set(["mp4", "webm", "mov", "mkv", "avi", "m4v"]);
const textExtensions = new Set(["txt", "md", "json", "csv", "log", "xml", "yml", "yaml", "ini", "toml"]);
const documentExtensions = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "rtf"]);
const codeExtensions = new Set(["js", "jsx", "ts", "tsx", "py", "cs", "cpp", "c", "html", "css", "scss", "java", "go", "rs", "php"]);
const executableExtensions = new Set(["exe", "lnk", "bat", "cmd", "msi", "appref-ms"]);
const gameLaunchers = ["steam", "epic games", "battle.net", "gog", "riot", "rockstar", "ubisoft", "ea app", "roblox"];
const developerTools = ["code", "visual studio", "cursor", "zed", "git", "node", "python", "unity", "unreal", "blender"];

function cleanAnalysisName(rawName) {
  return String(rawName || "Nuevo acceso")
    .replace(/\.(exe|lnk|bat|cmd|msi|appref-ms|png|jpg|jpeg|webp|gif|bmp|svg|ico|mp4|webm|mov|mkv|avi|m4v|txt|md|json|csv|log|xml|yml|yaml|ini|toml|pdf|docx?|xlsx?|pptx?|rtf)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Nuevo acceso";
}

function inferAnalysisType(name, extension, isDirectory) {
  const lowerName = String(name || "").toLowerCase();
  if (isDirectory) return "Proyecto";
  if (imageExtensions.has(extension) || videoExtensions.has(extension) || textExtensions.has(extension) || documentExtensions.has(extension) || codeExtensions.has(extension)) return "Archivo";
  if (gameLaunchers.some((entry) => lowerName.includes(entry))) return "Juego";
  if (developerTools.some((entry) => lowerName.includes(entry))) return "Programa";
  if (executableExtensions.has(extension)) return "Programa";
  return "Archivo";
}

function inferAnalysisIcon(type, extension) {
  if (type === "Proyecto") return "folder";
  if (imageExtensions.has(extension)) return "image";
  if (videoExtensions.has(extension)) return "video";
  if (textExtensions.has(extension) || documentExtensions.has(extension) || codeExtensions.has(extension)) return "text";
  if (type === "Juego") return "gamepad";
  if (type === "Programa") return "monitor";
  if (type === "Sistema") return "terminal";
  return "text";
}

function buildAnalysisDescription(type, extension, isDirectory) {
  if (isDirectory || type === "Proyecto") return "Carpeta o proyecto local detectado desde el sistema.";
  if (imageExtensions.has(extension)) return "Imagen local detectada desde el sistema.";
  if (videoExtensions.has(extension)) return "Video local detectado desde el sistema.";
  if (documentExtensions.has(extension)) return "Documento local detectado desde el sistema.";
  if (codeExtensions.has(extension)) return "Archivo de codigo detectado desde el sistema.";
  if (textExtensions.has(extension)) return "Archivo de texto o datos detectado desde el sistema.";
  if (type === "Juego") return "Juego o launcher de juegos detectado desde el sistema.";
  if (type === "Programa") return "Programa local detectado desde el sistema.";
  return "Archivo local detectado desde el sistema.";
}

async function analyzePath(targetPath) {
  if (!targetPath || typeof targetPath !== "string") return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(targetPath)) {
    const urlName = targetPath.split("/").filter(Boolean).pop() || targetPath;
    return {
      path: targetPath,
      exists: true,
      isDirectory: false,
      extension: "",
      sizeBytes: null,
      modifiedAt: null,
      createdAt: null,
      inferredType: "Archivo",
      icon: "text",
      name: cleanAnalysisName(urlName),
      description: "Enlace externo agregado a la biblioteca.",
      source: "URL externa",
    };
  }
  const exists = fsSync.existsSync(targetPath);
  const rawName = path.basename(targetPath);
  const extension = path.extname(rawName).replace(/^\./, "").toLowerCase();
  let stats = null;
  try {
    stats = exists ? await fs.stat(targetPath) : null;
  } catch {
    stats = null;
  }
  const isDirectory = Boolean(stats?.isDirectory());
  const name = cleanAnalysisName(rawName);
  const inferredType = inferAnalysisType(name, extension, isDirectory);
  return {
    path: targetPath,
    exists,
    isDirectory,
    extension,
    sizeBytes: stats && !isDirectory ? stats.size : null,
    modifiedAt: stats?.mtime ? stats.mtime.toISOString() : null,
    createdAt: stats?.birthtime ? stats.birthtime.toISOString() : null,
    inferredType,
    icon: inferAnalysisIcon(inferredType, extension),
    name,
    description: buildAnalysisDescription(inferredType, extension, isDirectory),
    source: isDirectory ? "Carpeta local" : "Archivo local",
  };
}

function extractMemoryFacts(message) {
  if (typeof message !== "string") return [];
  const text = message.trim();
  const lower = text.toLowerCase();
  const triggers = ["recuerda", "acuérdate", "acuerdate", "mi nombre", "me gusta", "prefiero", "quiero que"];
  if (!triggers.some((trigger) => lower.includes(trigger))) return [];
  return [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      createdAt: new Date().toISOString(),
    },
  ];
}

function copilotSystemPrompt() {
  return "Eres Nexus Copilot, la IA conversacional personal dentro de un launcher de escritorio para Windows. Hablas en espanol natural, con energia de pana cuando encaje, directo y como una persona. No eres un menu de opciones. No conviertas cada respuesta en una lista si el usuario solo quiere conversar. Puedes recordar preferencias, ayudar a organizar juegos, programas y proyectos, explicar ideas, proponer automatizaciones y acompanar al usuario. No abras programas ni ejecutes acciones: si algo requiere accion real, pide confirmacion clara. Usa la biblioteca local como contexto, no inventes datos sobre apps que no aparezcan. Si no sabes algo, dilo.";
}

function createUserMessage(message) {
  return {
    role: "user",
    content: typeof message === "string" ? message.trim() : "",
    createdAt: new Date().toISOString(),
  };
}

function normalizeAiText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function createAiContext(memory, items, message = "") {
  return {
    profileMemory: Array.isArray(memory.facts) ? memory.facts.slice(-12) : [],
    launcherLibrary: compactLibraryContext(items, message),
  };
}

async function rememberExchange(memory, userMessage, assistantText) {
  const nextMemory = {
    messages: [
      ...memory.messages,
      userMessage,
      { role: "assistant", content: assistantText, createdAt: new Date().toISOString() },
    ],
    facts: [...memory.facts, ...extractMemoryFacts(userMessage.content)],
  };
  await writeAiMemory(nextMemory);
  return nextMemory;
}

function compactLibraryContext(items, message = "") {
  const list = Array.isArray(items) ? items : [];
  const queryWords = normalizeAiText(message)
    .split(" ")
    .filter((word) => word.length > 2 && !["abre", "abrir", "ejecuta", "lanza", "inicia", "quiero", "puedes", "dime"].includes(word));

  const scored = list.map((item, index) => {
    const haystack = normalizeAiText(`${item.name} ${item.type} ${item.vendor} ${item.description}`);
    const queryScore = queryWords.reduce((score, word) => score + (haystack.includes(word) ? 10 : 0), 0);
    const favoriteScore = item.favorite ? 5 : 0;
    const readyScore = item.status === "Listo" ? 2 : 0;
    return { item, index, score: queryScore + favoriteScore + readyScore };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 32)
    .map(({ item }) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    vendor: item.vendor,
    status: item.status,
    location: item.location,
  }));
}

function getOutputText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  const chunks = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

async function callOpenAi({ message, items }) {
  const settings = await readAiSettings();
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXUS_OPENAI_API_KEY || settings.apiKey;
  const model = process.env.NEXUS_OPENAI_MODEL || process.env.OPENAI_MODEL || settings.openAiModel || settings.model || OPENAI_MODEL;
  if (!apiKey) {
    return {
      ok: false,
      needsKey: true,
      content:
        `Todavia no tengo una clave de IA conectada. Para activar mi cerebro real, pon tu API key en OPENAI_API_KEY, NEXUS_OPENAI_API_KEY o en este archivo local: ${settings.path}`,
    };
  }

  const memory = await readAiMemory();
  const now = new Date().toISOString();
  const userMessage = {
    role: "user",
    content: typeof message === "string" ? message.trim() : "",
    createdAt: now,
  };
  const libraryContext = compactLibraryContext(items, userMessage.content);
  const recentMessages = memory.messages.slice(-8).map((entry) => ({
    role: entry.role === "assistant" ? "assistant" : "user",
    content: entry.content,
  }));

  let response;
  try {
    response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      text: { verbosity: "medium" },
      input: [
        {
          role: "system",
          content:
            "Eres Nexus Copilot, la IA conversacional personal dentro de un launcher de escritorio para Windows. Hablas en espanol caribeno/neutro cuando encaje, natural, directo y como una persona. No eres un menu de opciones. No digas que eres solo una lista de recomendaciones. Puedes conversar, recordar preferencias, ayudar a organizar juegos/programas/proyectos, explicar ideas, proponer automatizaciones y acompanar al usuario. No abras programas ni ejecutes acciones: si algo requiere accion real, pide confirmacion clara. Usa la biblioteca local como contexto, no inventes datos sobre apps que no aparezcan. Si no sabes algo, dilo.",
        },
        {
          role: "system",
          content: JSON.stringify({
            profileMemory: memory.facts.slice(-12),
            launcherLibrary: libraryContext,
          }),
        },
        ...recentMessages,
        { role: "user", content: userMessage.content },
      ],
    }),
    });
  } catch (error) {
    return {
      ok: false,
      provider: "openai",
      model,
      content: isAbortError(error)
        ? "OpenAI tardo demasiado en responder. Corte la espera para que el chat no se quede pensando infinito."
        : `No pude conectar con OpenAI ahora mismo. ${error?.message || error}`,
    };
  }

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      content: `La IA respondio con un error ${response.status}. ${body.slice(0, 500)}`,
    };
  }

  const data = await response.json();
  const assistantText = getOutputText(data) || "Estoy aqui, pero no recibi texto util del modelo.";
  const nextMemory = {
    messages: [
      ...memory.messages,
      userMessage,
      { role: "assistant", content: assistantText, createdAt: new Date().toISOString() },
    ],
    facts: [...memory.facts, ...extractMemoryFacts(userMessage.content)],
  };
  await writeAiMemory(nextMemory);

  return {
    ok: true,
    provider: "openai",
    model,
    content: assistantText,
    remembered: nextMemory.facts.length,
  };
}

async function callOllama({ message, items }) {
  const settings = await readAiSettings();
  const baseUrl = settings.ollamaBaseUrl || OLLAMA_BASE_URL;
  const model = process.env.NEXUS_OLLAMA_MODEL || settings.ollamaModel || OLLAMA_MODEL;
  const memory = await readAiMemory();
  const userMessage = createUserMessage(message);
  const aiContext = createAiContext(memory, items, userMessage.content);
  const recentMessages = memory.messages.slice(-8).map((entry) => ({
    role: entry.role === "assistant" ? "assistant" : "user",
    content: entry.content,
  }));

  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: copilotSystemPrompt() },
          { role: "system", content: JSON.stringify(aiContext) },
          ...recentMessages,
          { role: "user", content: userMessage.content },
        ],
        options: {
          temperature: 0.72,
          num_ctx: 8192,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const missingModel = response.status === 404 || body.toLowerCase().includes("not found");
      return {
        ok: false,
        provider: "ollama",
        model,
        content: missingModel
          ? `Ollama esta instalado, pero falta el modelo local "${model}". Ejecuta: ollama pull ${model}`
          : `Ollama respondio con error ${response.status}. ${body.slice(0, 500)}`,
      };
    }

    const data = await response.json();
    const assistantText = data?.message?.content?.trim() || "Estoy aqui, pero Ollama no devolvio texto util.";
    const nextMemory = await rememberExchange(memory, userMessage, assistantText);
    return {
      ok: true,
      provider: "ollama",
      model,
      content: assistantText,
      remembered: nextMemory.facts.length,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "ollama",
      model,
      content:
        isAbortError(error)
          ? `Ollama tardo demasiado en responder desde ${baseUrl}. Corte la espera para que el chat no se quede pensando infinito.`
          : `No pude conectar con Ollama en ${baseUrl}. Instala y arranca la IA local con: .\\tools\\install-local-ai.ps1`,
    };
  }
}

async function resolveLmStudioModel(baseUrl, configuredModel) {
  if (configuredModel && configuredModel !== "auto") return configuredModel;
  try {
    const response = await fetchWithTimeout(`${baseUrl}/models`, {}, 5000);
    if (!response.ok) return null;
    const data = await response.json();
    const models = Array.isArray(data?.data) ? data.data : [];
    const firstChatModel = models.find((entry) => {
      const id = String(entry?.id || "").toLowerCase();
      return id && !id.includes("embed");
    });
    return firstChatModel?.id || null;
  } catch {
    return null;
  }
}

async function callLmStudio({ message, items }) {
  const settings = await readAiSettings();
  const baseUrl = settings.lmStudioBaseUrl || LM_STUDIO_BASE_URL;
  const model = await resolveLmStudioModel(baseUrl, process.env.NEXUS_LM_STUDIO_MODEL || settings.lmStudioModel);
  if (!model) {
    return {
      ok: false,
      provider: "lmstudio",
      content:
        `LM Studio esta encendido en ${baseUrl}, pero no hay ningun modelo de chat cargado. Descarga/carga un modelo conversacional en LM Studio y deja el servidor prendido.`,
    };
  }
  const memory = await readAiMemory();
  const userMessage = createUserMessage(message);
  const aiContext = createAiContext(memory, items, userMessage.content);
  const recentMessages = memory.messages.slice(-6).map((entry) => ({
    role: entry.role === "assistant" ? "assistant" : "user",
    content: entry.content,
  }));

  try {
    const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.72,
        messages: [
          { role: "system", content: copilotSystemPrompt() },
          { role: "system", content: JSON.stringify(aiContext) },
          ...recentMessages,
          { role: "user", content: userMessage.content },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const contextError = /n_keep|n_ctx|context length|tokens to keep/i.test(body);
      return {
        ok: false,
        provider: "lmstudio",
        model,
        content:
          contextError
            ? "LM Studio rechazo el mensaje porque el contexto era demasiado grande para el modelo cargado. Ya compacte lo que envio; si vuelve a pasar, carga el modelo con mas contexto en LM Studio o usa una pregunta mas corta."
            : `LM Studio respondio con error ${response.status}. Asegurate de cargar un modelo y presionar Start Server en Developer/Local Server. ${body.slice(0, 500)}`,
      };
    }

    const data = await response.json();
    const assistantText =
      data?.choices?.[0]?.message?.content?.trim() || "Estoy aqui, pero LM Studio no devolvio texto util.";
    const nextMemory = await rememberExchange(memory, userMessage, assistantText);
    return {
      ok: true,
      provider: "lmstudio",
      model,
      content: assistantText,
      remembered: nextMemory.facts.length,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "lmstudio",
      model,
      content:
        isAbortError(error)
          ? `LM Studio tardo demasiado en responder desde ${baseUrl}. Corte la espera para que el chat no se quede pensando infinito. Revisa si el modelo esta cargado o baja el contexto del modelo.`
          : `No pude conectar con LM Studio en ${baseUrl}. Abre LM Studio, carga un modelo y activa Start Server en la pantalla Developer/Local Server.`,
    };
  }
}

async function callAi(payload) {
  const settings = await readAiSettings();
  if (settings.provider === "openai") {
    const openAiResponse = await callOpenAi(payload);
    if (openAiResponse.ok) return openAiResponse;
    if (!/insufficient_quota|429|quota/i.test(openAiResponse.content || "")) return openAiResponse;
  }
  if (settings.provider === "ollama") {
    return callOllama(payload);
  }
  return callLmStudio(payload);
}

async function ensureLibraryFile() {
  const file = userLibraryPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (!fsSync.existsSync(file)) {
    await fs.writeFile(file, "[]", "utf8");
  }
  return file;
}

function normalizeLibraryKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function readBundledLibrary() {
  if (process.env.NEXUS_INCLUDE_BUNDLED_LIBRARY !== "1") return [];
  const candidates = [
    path.join(__dirname, "..", "dist", "library.generated.json"),
    path.join(__dirname, "..", "public", "library.generated.json"),
    path.join(app.getAppPath(), "dist", "library.generated.json"),
    path.join(app.getAppPath(), "public", "library.generated.json"),
    path.join(process.resourcesPath || "", "app", "dist", "library.generated.json"),
    path.join(process.resourcesPath || "", "app", "public", "library.generated.json"),
  ];
  for (const candidate of candidates) {
    if (!fsSync.existsSync(candidate)) continue;
    try {
      const raw = await fs.readFile(candidate, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mergeLibraries(storedItems, bundledItems) {
  const merged = [];
  const indexByKey = new Map();

  function addOrReplace(item, preferExisting = false) {
    if (!item || typeof item !== "object") return;
    const nameKey = normalizeLibraryKey(`${item.type || ""}-${item.name || item.id || ""}`);
    const locationKey = normalizeLibraryKey(item.location || item.realPath || "");
    const keys = [item.id, nameKey, locationKey].filter(Boolean).map(normalizeLibraryKey);
    const existingIndex = keys.map((key) => indexByKey.get(key)).find((index) => typeof index === "number");
    if (typeof existingIndex === "number") {
      if (!preferExisting) merged[existingIndex] = { ...merged[existingIndex], ...item };
      keys.forEach((key) => indexByKey.set(key, existingIndex));
      return;
    }
    const nextIndex = merged.length;
    merged.push(item);
    keys.forEach((key) => indexByKey.set(key, nextIndex));
  }

  bundledItems.forEach((item) => addOrReplace(item, true));
  storedItems.forEach((item) => addOrReplace(item));
  return merged;
}

function normalizeLibraryArray(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (Array.isArray(entry)) return normalizeLibraryArray(entry);
    if (Array.isArray(entry?.value)) return normalizeLibraryArray(entry.value);
    if (entry && typeof entry === "object" && (entry.name || entry.location || entry.id)) return [entry];
    return [];
  });
}

async function readLibrary() {
  const file = await ensureLibraryFile();
  const raw = await fs.readFile(file, "utf8");
  try {
    const stored = JSON.parse(raw);
    const storedItems = normalizeLibraryArray(stored);
    const bundledItems = await readBundledLibrary();
    if (!bundledItems.length) {
      if (storedItems.length !== (Array.isArray(stored) ? stored.length : 0)) {
        await fs.writeFile(file, JSON.stringify(storedItems, null, 2), "utf8");
      }
      return storedItems;
    }
    const merged = mergeLibraries(storedItems, bundledItems);
    if (merged.length > storedItems.length || merged.length !== (Array.isArray(stored) ? stored.length : 0)) {
      await fs.writeFile(file, JSON.stringify(merged, null, 2), "utf8");
    }
    return merged;
  } catch {
    const bundledItems = await readBundledLibrary();
    if (bundledItems.length) {
      await fs.writeFile(file, JSON.stringify(bundledItems, null, 2), "utf8");
    }
    return bundledItems;
  }
}

async function writeLibrary(items) {
  const file = await ensureLibraryFile();
  const current = await readLibrary();
  if (Array.isArray(current) && current.length > 50 && Array.isArray(items) && items.length < 20) {
    return current;
  }
  await fs.writeFile(file, JSON.stringify(items, null, 2), "utf8");
  return items;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#141519",
    title: "Nexus Launcher",
    frame: false,
    show: true,
    center: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.setTitle("Nexus Launcher");
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on("did-fail-load", (_event, code, description) => {
    console.error(`Nexus load failed: ${code} ${description}`);
  });

  mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    readLibrary().catch((error) => {
      console.error(`Nexus library migration failed: ${error?.message || error}`);
    });
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("library:load", readLibrary);
ipcMain.handle("library:save", (_event, items) => writeLibrary(items));
ipcMain.handle("ai:memory", readAiMemory);
ipcMain.handle("ai:chat", async (_event, payload) => callAi(payload || {}));
ipcMain.handle("ai:clearMemory", async () => writeAiMemory({ messages: [], facts: [] }));
ipcMain.handle("notes:load", readNotes);
ipcMain.handle("notes:save", (_event, notes) => writeNotes(notes));
ipcMain.handle("system:snapshot", getSystemSnapshot);
ipcMain.handle("usage:load", readUsageStats);

ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window:maximize", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return;
  }
  mainWindow.maximize();
});

ipcMain.handle("window:close", () => {
  mainWindow?.close();
});

ipcMain.handle("path:validate", async (_event, targetPath) => {
  if (!targetPath || typeof targetPath !== "string") return false;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(targetPath)) return true;
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("path:analyze", async (_event, targetPath) => analyzePath(targetPath));

ipcMain.handle("path:open", async (_event, targetPath, metadata = {}) => {
  if (!targetPath || typeof targetPath !== "string") {
    return { ok: false, message: "Ruta vacia" };
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(targetPath)) {
    await shell.openExternal(targetPath);
    return { ok: true };
  }
  const exists = fsSync.existsSync(targetPath);
  if (!exists) return { ok: false, message: "La ruta no existe" };
  if (/steam\.exe$/i.test(targetPath.replaceAll("\\", "/"))) {
    await shell.openExternal("steam://open/main");
    startUsageTracking(targetPath, metadata);
    return { ok: true };
  }
  const error = await shell.openPath(targetPath);
  if (!error) startUsageTracking(targetPath, metadata);
  return error ? { ok: false, message: error } : { ok: true };
});

ipcMain.handle("path:reveal", async (_event, targetPath) => {
  if (!targetPath || typeof targetPath !== "string") {
    return { ok: false, message: "Ruta vacia" };
  }
  if (!fsSync.existsSync(targetPath)) return { ok: false, message: "La ruta no existe" };
  shell.showItemInFolder(targetPath);
  return { ok: true };
});

ipcMain.handle("dialog:pickExecutable", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Agregar programa o juego",
    properties: ["openFile"],
    filters: [
      { name: "Programas", extensions: ["exe", "lnk", "bat", "cmd"] },
      { name: "Todos", extensions: ["*"] },
    ],
  });
  if (result.canceled) return null;
  return result.filePaths[0] ?? null;
});

ipcMain.handle("dialog:pickAnyFile", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Agregar archivo",
    properties: ["openFile"],
    filters: [
      { name: "Archivos utiles", extensions: ["exe", "lnk", "bat", "cmd", "msi", "png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "ico", "mp4", "webm", "mov", "mkv", "avi", "txt", "md", "json", "csv", "log", "xml", "yml", "yaml", "ini", "toml", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "rtf", "js", "jsx", "ts", "tsx", "py", "cs", "cpp", "c", "html", "css", "scss"] },
      { name: "Todos", extensions: ["*"] },
    ],
  });
  if (result.canceled) return null;
  return result.filePaths[0] ?? null;
});

ipcMain.handle("dialog:pickFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Agregar carpeta o proyecto",
    properties: ["openDirectory"],
  });
  if (result.canceled) return null;
  return result.filePaths[0] ?? null;
});
