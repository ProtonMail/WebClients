import { contextBridge, ipcRenderer } from "electron";
import type { IPCMeetMessageBroker } from "@proton/shared/lib/desktop/desktopTypes";
import * as Sentry from "@sentry/electron/renderer";
import { disableMouseNavigation } from "@proton/shared/lib/desktop/disableMouseNavigation";

Sentry.init();

contextBridge.exposeInMainWorld("ipcMeetMessageBroker", {
    send: (type, payload) => {
        ipcRenderer.send("meetClientUpdate", { type, payload });
    },
} satisfies IPCMeetMessageBroker);

disableMouseNavigation();
