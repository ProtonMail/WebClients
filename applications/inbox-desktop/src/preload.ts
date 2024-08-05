import { contextBridge, ipcRenderer } from "electron";
import { DESKTOP_FEATURES, IPCClientUpdateMessagePayload } from "./ipc/ipcConstants";
import { ipcLogger } from "./utils/log";
import {
    IPCClientUpdateMessageType,
    IPCGetInfoMessage,
} from "./utils/external/packages/shared/lib/desktop/desktopTypes";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    hasFeature: (feature: keyof typeof DESKTOP_FEATURES) => {
        return ipcRenderer.sendSync("hasFeature", feature);
    },

    getInfo: <T extends IPCGetInfoMessage["type"]>(type: T): Extract<IPCGetInfoMessage, { type: T }>["result"] => {
        return ipcRenderer.sendSync("getInfo", type);
    },

    send: <T extends IPCClientUpdateMessageType>(
        type: IPCClientUpdateMessageType,
        payload: IPCClientUpdateMessagePayload<T>,
    ) => {
        ipcLogger.info(`Sending message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
});
