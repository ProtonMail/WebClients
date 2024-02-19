import { contextBridge, ipcRenderer } from "electron";
import Logger from "electron-log";
import { IPCMessagePayload, IPCMessageType } from "./ipc/ipcConstants";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    send: <T extends IPCMessageType>(type: IPCMessageType, payload: IPCMessagePayload<T>) => {
        Logger.info(`Sending IPC message: ${type}`);
        switch (type) {
            case "updateNotification":
                ipcRenderer.send("updateNotification", payload);
                break;
            case "userLogout":
                ipcRenderer.send("userLogout");
                break;
            case "clearAppData":
                ipcRenderer.send("userLogout");
                break;
            case "oauthPopupOpened":
                ipcRenderer.send("oauthPopupOpened", payload);
                break;
            case "trialEnd":
                ipcRenderer.send("trialEnd", payload);
                break;
            case "changeView":
                ipcRenderer.send("changeView", payload);
                break;
            default:
                Logger.error(`Unknown IPC message type: ${type}`);
                break;
        }
    },
});
