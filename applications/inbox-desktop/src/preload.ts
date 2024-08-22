import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { ipcLogger } from "./utils/log";
import {
    IPCInboxHostUpdateMessage,
    IPCInboxMessageBroker,
} from "./utils/external/packages/shared/lib/desktop/desktopTypes";

function isValidHostUpdateMessage(message: unknown): message is IPCInboxHostUpdateMessage {
    return !!(message && typeof message === "object" && "type" in message && typeof message.type === "string");
}

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    hasFeature: (feature) => {
        return ipcRenderer.sendSync("hasFeature", feature);
    },

    getInfo: (type) => {
        return ipcRenderer.sendSync("getInfo", type);
    },

    on: (type, callback) => {
        const handleHostUpdate = (_event: IpcRendererEvent, message: unknown) => {
            if (!isValidHostUpdateMessage(message) || message.type !== type) {
                return;
            }

            callback(message.payload);
        };

        ipcRenderer.on("hostUpdate", handleHostUpdate);

        return {
            removeListener() {
                ipcRenderer.off("hostUpdate", handleHostUpdate);
            },
        };
    },

    send: (type, payload) => {
        ipcLogger.info(`Sending message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
} satisfies IPCInboxMessageBroker);
