import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type {
    IPCInboxMessageBroker,
    IPCInboxHostUpdateMessageType,
    IPCInboxHostUpdateListener,
    IPCInboxHostUpdateMessage,
} from "@proton/shared/lib/desktop/desktopTypes";
import Logger from "electron-log";

const preloadLogger = Logger.scope("preload");

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    hasFeature: (feature) => {
        return ipcRenderer.sendSync("hasFeature", feature);
    },

    getInfo: (type) => {
        return ipcRenderer.sendSync("getInfo", type);
    },

    on: addHostUpdateListener,
    send: (type, payload) => {
        preloadLogger.info(`Sending message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
} satisfies IPCInboxMessageBroker);

// THIS NEEDS REFACTOR: inda-refactor-001
// Either avoid this function completelly or at least implemet it in zod.
function isValidHostUpdateMessage(
    data: unknown,
): { success: false; error: string } | { success: true; data: IPCInboxHostUpdateMessage } {
    if (!data) {
        return { success: false, error: "is null" };
    }
    if (typeof data !== "object") {
        return { success: false, error: "not an object" };
    }

    if (!("type" in data)) {
        return { success: false, error: "not have type" };
    }

    if (typeof data.type !== "string") {
        return { success: false, error: "have non-string type" };
    }

    if (!("payload" in data)) {
        return { success: false, error: "not have payload" };
    }

    const allowedTypes = ["captureMessage", "defaultMailtoChecked"];
    if (allowedTypes.indexOf(data.type) > -1) {
        return { success: true, data: data as IPCInboxHostUpdateMessage };
    }

    return { success: false, error: `unknown type ${data.type}` };
} // Assuming that broker was added as window object.

function addHostUpdateListener(eventType: IPCInboxHostUpdateMessageType, callback: IPCInboxHostUpdateListener) {
    const handleHostUpdate = (_event: IpcRendererEvent, message: unknown) => {
        const parsed = isValidHostUpdateMessage(message);
        if (!parsed.success) {
            preloadLogger.error("Invalid host update message format:", parsed.error);
            return;
        }

        if (parsed.data.type != eventType) {
            // Needs refactor: inda-refactor-001
            // for tracing do: preloadLogger.debug(`Skipping ${eventType} for event ${parsed.data.type} payload`);
            return;
        }

        callback(parsed.data.payload);
    };

    ipcRenderer.on("hostUpdate", handleHostUpdate);

    return {
        removeListener() {
            ipcRenderer.off("hostUpdate", handleHostUpdate);
        },
    };
}
