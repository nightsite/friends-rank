import { contextBridge, ipcRenderer } from "electron";

export type DesktopBridgeApi = {
  isDesktop: boolean;
  openExternal: (url: string) => Promise<boolean>;
  copyText: (value: string) => Promise<boolean>;
  notify: (title: string, body: string) => Promise<boolean>;
};

const api: DesktopBridgeApi = {
  isDesktop: true,
  openExternal: (url: string) => ipcRenderer.invoke("desktop:openExternal", url),
  copyText: (value: string) => ipcRenderer.invoke("desktop:copyText", value),
  notify: (title: string, body: string) =>
    ipcRenderer.invoke("desktop:notify", { title, body }),
};

contextBridge.exposeInMainWorld("desktopApi", api);
