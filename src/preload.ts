import { contextBridge, ipcRenderer } from "electron";
import Logger from "electron-log";
import { IPCMessagePayload, IPCMessageType } from "./ipc/ipcConstants";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    send: <T extends IPCMessageType>(type: IPCMessageType, payload: IPCMessagePayload<T>) => {
        Logger.info(`Sending IPC message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
});
