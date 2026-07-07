const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexus", {
  loadLibrary: () => ipcRenderer.invoke("library:load"),
  saveLibrary: (items) => ipcRenderer.invoke("library:save", items),
  validatePath: (targetPath) => ipcRenderer.invoke("path:validate", targetPath),
  openPath: (targetPath) => ipcRenderer.invoke("path:open", targetPath),
  revealPath: (targetPath) => ipcRenderer.invoke("path:reveal", targetPath),
  pickExecutable: () => ipcRenderer.invoke("dialog:pickExecutable"),
  pickAnyFile: () => ipcRenderer.invoke("dialog:pickAnyFile"),
  pickFolder: () => ipcRenderer.invoke("dialog:pickFolder"),
  chatWithAi: (payload) => ipcRenderer.invoke("ai:chat", payload),
  loadAiMemory: () => ipcRenderer.invoke("ai:memory"),
  clearAiMemory: () => ipcRenderer.invoke("ai:clearMemory"),
  loadNotes: () => ipcRenderer.invoke("notes:load"),
  saveNotes: (notes) => ipcRenderer.invoke("notes:save", notes),
  getSystemSnapshot: () => ipcRenderer.invoke("system:snapshot"),
  minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window:maximize"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
});
