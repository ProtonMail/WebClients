import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import {
    type IPCInboxMessageBroker,
    type IPCInboxHostUpdateMessageType,
    type IPCInboxHostUpdateListener,
    IPCInboxHostUpdateMessageSchema,
} from "@proton/shared/lib/desktop/desktopTypes";
import Logger from "electron-log";
import { captureMessage } from "@sentry/electron/renderer";
import * as Sentry from "@sentry/electron/renderer";

const preloadLogger = Logger.scope("preload");

Sentry.init();

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

    on: addHostUpdateListener,
    send: (type, payload) => {
        preloadLogger.info(`Sending message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
} satisfies IPCInboxMessageBroker);

contextBridge.exposeInMainWorld("crashBandicoot", {
    reportCrash: () => {
        const messageId = captureMessage("Crash bandicoot report", {
            level: "error",
            tags: { logScope: "crashBandicoot" },
            extra: {},
        });

        console.log(`${messageId} reported`);
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
