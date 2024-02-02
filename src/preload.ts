import { contextBridge, ipcRenderer } from "electron";
import { IPCMessagePayload, IPCMessageType } from "./ipc/ipcConstants";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    send: <T extends IPCMessageType>(type: IPCMessageType, payload: IPCMessagePayload<T>) => {
        if (type === "updateNotification") {
            ipcRenderer.send("updateNotification", payload);
        }
        if (type === "userLogout") {
            ipcRenderer.send("userLogout");
        }
        if (type === "clearAppData") {
            ipcRenderer.send("userLogout");
        }
        if (type === "oauthPopupOpened") {
            ipcRenderer.send("oauthPopupOpened", payload);
        }
    },
});
