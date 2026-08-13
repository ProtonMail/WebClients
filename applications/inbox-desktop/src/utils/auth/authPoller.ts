import { BrowserWindow } from "electron";

import { IPCInboxClientUpdateMessage } from "@proton/shared/lib/desktop/desktopTypes";
import { getCurrentView } from "../view/viewManagement";

type AuthStatusResultMessage = Extract<IPCInboxClientUpdateMessage, { type: "authStatusResult" }>;

const AUTH_POLL_RTT_TIMEOUT_MS = 1000;
const AUTH_POLL_INTERVAL_MS = 2500;

class AuthStatusPoller {
    private static instance: AuthStatusPoller;
    private callbacks: Array<(authStatus: boolean) => void> = [];
    private authPollRequestsReceivedReply: Map<string, boolean> = new Map();
    private intervalHandle: NodeJS.Timeout | undefined;

    public static getInstance(): AuthStatusPoller {
        if (!AuthStatusPoller.instance) {
            AuthStatusPoller.instance = new AuthStatusPoller();
        }
        return AuthStatusPoller.instance;
    }

    private constructor() {}

    private performCallbacks(hasAuth: boolean) {
        for (const cb of this.callbacks) {
            cb(hasAuth);
        }
    }

    public performPoll() {
        const currentView = getCurrentView();
        if (!currentView || currentView.webContents.isDestroyed()) {
            return;
        }

        const uuid = crypto.randomUUID();

        this.authPollRequestsReceivedReply.set(uuid, false);
        currentView.webContents.send("hostUpdate", { type: "authStatusCheck", payload: uuid });

        setTimeout(() => {
            const pollStatus = this.authPollRequestsReceivedReply.get(uuid);
            if (pollStatus === undefined) return;

            // Received no response within the timeout
            if (pollStatus === false) {
                this.performCallbacks(false);
            }

            this.authPollRequestsReceivedReply.delete(uuid);
        }, AUTH_POLL_RTT_TIMEOUT_MS);
    }

    public start() {
        if (this.intervalHandle) {
            return;
        }
        this.performPoll();
        this.intervalHandle = setInterval(() => {
            this.performPoll();
        }, AUTH_POLL_INTERVAL_MS);
    }

    public pause() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = undefined;
        }
    }

    public stop() {
        this.pause();
        this.authPollRequestsReceivedReply.clear();
    }

    public attachToWindow(window: BrowserWindow) {
        window.on("hide", () => this.pause());
        window.on("minimize", () => this.pause());
        window.on("show", () => this.start());
        window.on("restore", () => this.start());
        window.on("closed", () => this.stop());
    }

    public registerCallback(cb: (authStatus: boolean) => void) {
        this.callbacks.push(cb);
    }

    public answerIPC(message: AuthStatusResultMessage) {
        const pollData = this.authPollRequestsReceivedReply.get(message.payload.uuid);

        if (pollData === undefined) {
            return;
        }

        this.authPollRequestsReceivedReply.set(message.payload.uuid, true);

        this.performCallbacks(message.payload.hasAuth);
    }
}

export const authStatusPoller = AuthStatusPoller.getInstance();
