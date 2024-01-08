import { contextBridge, ipcRenderer } from "electron";
import { IPC_CALLS } from "./ipc/ipcConstants";

contextBridge.exposeInMainWorld("protonDesktopAPI", {
    desktop: true,
    updateNotification: (count: number) => ipcRenderer.send(IPC_CALLS.updateNotification, count),
});
