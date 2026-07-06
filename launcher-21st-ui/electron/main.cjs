const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

let mainWindow;
const OPENAI_MODEL = process.env.NEXUS_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-5.5";

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

async function readAiSettings() {
  const file = aiSettingsPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (!fsSync.existsSync(file)) {
    await fs.writeFile(
      file,
      JSON.stringify(
        {
          apiKey: "",
          model: OPENAI_MODEL,
        },
        null,
        2,
      ),
      "utf8",
    );
  }
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf8"));
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "",
      model: typeof parsed.model === "string" && parsed.model.trim() ? parsed.model.trim() : OPENAI_MODEL,
      path: file,
    };
  } catch {
    return { apiKey: "", model: OPENAI_MODEL, path: file };
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

function compactLibraryContext(items) {
  const list = Array.isArray(items) ? items : [];
  return list.slice(0, 120).map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    vendor: item.vendor,
    status: item.status,
    location: item.location,
    description: item.description,
    version: item.version,
    size: item.size,
    source: item.source,
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
  const model = process.env.NEXUS_OPENAI_MODEL || process.env.OPENAI_MODEL || settings.model || OPENAI_MODEL;
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
  const libraryContext = compactLibraryContext(items);
  const recentMessages = memory.messages.map((entry) => ({
    role: entry.role === "assistant" ? "assistant" : "user",
    content: entry.content,
  }));

  const response = await fetch("https://api.openai.com/v1/responses", {
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
            profileMemory: memory.facts,
            launcherLibrary: libraryContext,
          }),
        },
        ...recentMessages,
        { role: "user", content: userMessage.content },
      ],
    }),
  });

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
    model,
    content: assistantText,
    remembered: nextMemory.facts.length,
  };
}

async function ensureLibraryFile() {
  const file = userLibraryPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (!fsSync.existsSync(file)) {
    await fs.writeFile(file, "[]", "utf8");
  }
  return file;
}

async function readLibrary() {
  const file = await ensureLibraryFile();
  const raw = await fs.readFile(file, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
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
ipcMain.handle("ai:chat", async (_event, payload) => callOpenAi(payload || {}));
ipcMain.handle("ai:clearMemory", async () => writeAiMemory({ messages: [], facts: [] }));

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

ipcMain.handle("path:open", async (_event, targetPath) => {
  if (!targetPath || typeof targetPath !== "string") {
    return { ok: false, message: "Ruta vacia" };
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(targetPath)) {
    await shell.openExternal(targetPath);
    return { ok: true };
  }
  const exists = fsSync.existsSync(targetPath);
  if (!exists) return { ok: false, message: "La ruta no existe" };
  const error = await shell.openPath(targetPath);
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

ipcMain.handle("dialog:pickFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Agregar carpeta o proyecto",
    properties: ["openDirectory"],
  });
  if (result.canceled) return null;
  return result.filePaths[0] ?? null;
});
