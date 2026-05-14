import { app, BrowserWindow, clipboard, ipcMain, Notification, shell } from "electron";
import path from "node:path";

const isDev = !app.isPackaged;
const startUrl =
  process.env.ELECTRON_START_URL ??
  process.env.DESKTOP_WEB_URL ??
  "https://friends-rank.vercel.app/desktop";

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#09090b",
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  win.once("ready-to-show", () => win.show());
  void win.loadURL(startUrl);

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

ipcMain.handle("desktop:openExternal", async (_event, url: string) => {
  if (!/^https?:\/\//i.test(url)) return false;
  await shell.openExternal(url);
  return true;
});

ipcMain.handle("desktop:copyText", (_event, value: string) => {
  clipboard.writeText(String(value ?? ""));
  return true;
});

ipcMain.handle(
  "desktop:notify",
  (_event, payload: { title?: string; body?: string } | null) => {
    const title = payload?.title?.trim() || "Friends Rank";
    const body = payload?.body?.trim() || "";
    if (!Notification.isSupported()) return false;
    new Notification({ title, body }).show();
    return true;
  },
);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
