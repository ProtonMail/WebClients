import { contextBridge, ipcRenderer } from "electron";
import * as Sentry from "@sentry/electron/renderer";
import { disableMouseNavigation } from "@proton/shared/lib/desktop/disableMouseNavigation";
import type { IPCInboxMessageBroker } from "@proton/shared/lib/desktop/desktopTypes";
import Logger from "electron-log";

const preloadLogger = Logger.scope("preload");

Sentry.init();

// Expose minimal IPC bridge for early access communication
contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    hasFeature: (feature) => {
        return ipcRenderer.sendSync("hasFeature", feature);
    },

    send: (type, payload) => {
        preloadLogger.info(`Sending message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
} satisfies IPCInboxMessageBroker);

disableMouseNavigation();
