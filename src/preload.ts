import { contextBridge, ipcRenderer } from "electron";
import log from "electron-log";
import { IPCMessagePayload, IPCMessageType } from "./ipc/ipcConstants";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    send: <T extends IPCMessageType>(type: IPCMessageType, payload: IPCMessagePayload<T>) => {
        log.info(`Sending IPC message: ${type}`);
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
            default:
                log.error(`Unknown IPC message type: ${type}`);
                break;
        }
    },
});
