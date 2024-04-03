import { contextBridge, ipcRenderer } from "electron";
import Logger from "electron-log";
import {
    DESKTOP_FEATURES,
    IPCClientUpdateMessagePayload,
    IPCClientUpdateMessageType,
    IPCGetInfoMessage,
} from "./ipc/ipcConstants";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    hasFeature: (feature: keyof typeof DESKTOP_FEATURES) => {
        Logger.info(`Checking if feature is available: ${feature}`);
        return ipcRenderer.sendSync("hasFeature", feature);
    },

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
