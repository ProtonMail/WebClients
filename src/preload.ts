import { contextBridge, ipcRenderer } from "electron";
import Logger from "electron-log";
import { IPCClientUpdateMessagePayload, IPCClientUpdateMessageType, IPCGetInfoMessage } from "./ipc/ipcConstants";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    getInfo: <T extends IPCGetInfoMessage["type"]>(type: T): Extract<IPCGetInfoMessage, { type: T }>["result"] => {
        Logger.info(`Requesting info from host: ${type}`);
        return ipcRenderer.sendSync("getInfo", type);
    },

    send: <T extends IPCClientUpdateMessageType>(
        type: IPCClientUpdateMessageType,
        payload: IPCClientUpdateMessagePayload<T>,
    ) => {
        Logger.info(`Sending IPC message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
});
