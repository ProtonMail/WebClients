import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import {
    type IPCInboxMessageBroker,
    type IPCInboxClientUpdateMessageType,
    type IPCInboxHostUpdateMessageType,
    type IPCInboxHostUpdateListener,
    IPCInboxHostUpdateMessageSchema,
} from "@proton/shared/lib/desktop/desktopTypes";
import Logger from "electron-log";
import { disableMouseNavigation } from "@proton/shared/lib/desktop/disableMouseNavigation";

const preloadLogger = Logger.scope("preload");

// Some IPC messages are fired too often and pollute the logs, filter them here.
const SEND_LOG_MUTED_TYPES = new Set<IPCInboxClientUpdateMessageType>(["authStatusResult"]);

function logSend(type: IPCInboxClientUpdateMessageType) {
    if (SEND_LOG_MUTED_TYPES.has(type)) {
        return;
    }

    preloadLogger.info(`Sending message: ${type}`);
}

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    hasFeature: (feature) => {
        return ipcRenderer.sendSync("hasFeature", feature);
    },

    getInfo: (type) => {
        return ipcRenderer.sendSync("getInfo", type);
    },

    getUserInfo: (type, userID) => {
        return ipcRenderer.sendSync("getUserInfo", type, userID);
    },

    getAsyncData: (type, ...args) => {
        return ipcRenderer.invoke("getAsyncData", type, ...args);
    },

    on: addHostUpdateListener,
    send: (type, payload) => {
        logSend(type);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
} satisfies IPCInboxMessageBroker);

contextBridge.exposeInMainWorld("crashBandicoot", {
    reportTestingError: () => {
        ipcRenderer.send("clientUpdate", {
            type: "reportTestingError",
            payload: undefined,
        });
    },
    triggerCrash: () => {
        ipcRenderer.send("clientUpdate", {
            type: "triggerCrash",
            payload: undefined,
        });
    },
});

function addHostUpdateListener(eventType: IPCInboxHostUpdateMessageType, callback: IPCInboxHostUpdateListener) {
    const handleHostUpdate = (_event: IpcRendererEvent, message: unknown) => {
        const parsed = IPCInboxHostUpdateMessageSchema.safeParse(message);

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

disableMouseNavigation();
