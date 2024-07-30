import { contextBridge, ipcRenderer } from "electron";
import { ipcLogger } from "./utils/log";
import { IPCInboxMessageBroker } from "./utils/external/packages/shared/lib/desktop/desktopTypes";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    hasFeature: (feature) => {
        return ipcRenderer.sendSync("hasFeature", feature);
    },

    getInfo: (type) => {
        return ipcRenderer.sendSync("getInfo", type);
    },

    send: (type, payload) => {
        ipcLogger.info(`Sending message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
} satisfies IPCInboxMessageBroker);
