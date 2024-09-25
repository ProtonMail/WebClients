import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { ipcLogger } from "./utils/log";
import {
    isValidHostUpdateMessage,
    IPCInboxMessageBroker,
    IPCInboxHostUpdateMessageType,
    IPCInboxHostUpdateListener,
    PayloadOfIPCInboxHostUpdateType,
} from "@proton/shared/lib/desktop/desktopTypes";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    hasFeature: (feature) => {
        return ipcRenderer.sendSync("hasFeature", feature);
    },

    getInfo: (type) => {
        return ipcRenderer.sendSync("getInfo", type);
    },

    on: addHostUpdateListener,
    send: (type, payload) => {
        ipcLogger.info(`Sending message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
} satisfies IPCInboxMessageBroker);

function addHostUpdateListener<T extends IPCInboxHostUpdateMessageType>(
    eventType: T,
    callback: IPCInboxHostUpdateListener<T>,
) {
    const handleHostUpdate = (_event: IpcRendererEvent, message: unknown) => {
        const parsed = isValidHostUpdateMessage(message);
        if (!parsed.success) {
            ipcLogger.error("Invalid host update message format", parsed.error);
            return;
        }

        if (!parsed || !parsed.data || !parsed.data.payload) {
            ipcLogger.warn(`Skipping ${eventType} due to missing payload`, message);
            return;
        }

        if (parsed.data.type != eventType) {
            ipcLogger.debug(`Skipping ${eventType} for event ${parsed.data.type} payload`);
            return;
        }

        const payload = parsed.data.payload as unknown as PayloadOfIPCInboxHostUpdateType<T>;
        callback(payload);
    };

    ipcRenderer.on("hostUpdate", handleHostUpdate);

    return {
        removeListener() {
            ipcRenderer.off("hostUpdate", handleHostUpdate);
        },
    };
}
