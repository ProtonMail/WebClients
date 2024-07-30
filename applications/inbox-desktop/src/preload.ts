import { contextBridge, ipcRenderer } from "electron";
import { DESKTOP_FEATURES, IPCClientUpdateMessagePayload } from "./ipc/ipcConstants";
import { ipcLogger } from "./utils/log";
import {
    IPCInboxClientUpdateMessageType,
    IPCInboxGetInfoMessage,
} from "./utils/external/packages/shared/lib/desktop/desktopTypes";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    hasFeature: (feature: keyof typeof DESKTOP_FEATURES) => {
        return ipcRenderer.sendSync("hasFeature", feature);
    },

    getInfo: <T extends IPCInboxGetInfoMessage["type"]>(
        type: T,
    ): Extract<IPCInboxGetInfoMessage, { type: T }>["result"] => {
        return ipcRenderer.sendSync("getInfo", type);
    },

    send: <T extends IPCInboxClientUpdateMessageType>(
        type: IPCInboxClientUpdateMessageType,
        payload: IPCClientUpdateMessagePayload<T>,
    ) => {
        ipcLogger.info(`Sending message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
});
