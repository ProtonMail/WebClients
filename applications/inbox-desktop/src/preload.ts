import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { ipcLogger } from "./utils/log";
import {
    isValidHostUpdateMessage,
    IPCInboxMessageBroker,
    IPCInboxHostUpdateMessageType,
    IPCInboxHostUpdateListener,
} from "@proton/shared/lib/desktop/desktopTypes";
import { captureMessage } from "@sentry/electron/renderer";
import * as Sentry from "@sentry/electron/renderer";

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
        ipcLogger.info(`Sending message: ${type}`);
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
        const parsed = isValidHostUpdateMessage(message);
        if (!parsed.success) {
            ipcLogger.error("Invalid host update message format:", parsed.error);
            return;
        }

        if (parsed.data.type != eventType) {
            // Needs refactor: inda-refactor-001
            // for tracing do: ipcLogger.debug(`Skipping ${eventType} for event ${parsed.data.type} payload`);
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
