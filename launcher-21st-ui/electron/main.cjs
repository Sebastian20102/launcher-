const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

let mainWindow;

app.setPath("userData", path.join(app.getPath("appData"), "Nexus Launcher"));
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

function userLibraryPath() {
  return path.join(app.getPath("userData"), "library.json");
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
