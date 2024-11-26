import type { Transport, LogMessage } from "electron-log";
import type { HttpsProtonMeDesktopInboxHeartbeatTotalV1SchemaJson } from "@proton/metrics/types/desktop_inbox_heartbeat_total_v1.schema";
import { getMailView } from "./view/viewManagement";
import { getSettings } from "../store/settingsStore";
import { mainLogger } from "./log";

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // minimum is 5 min

type TextBool = "true" | "false";

class BooleanRecord {
    private val: boolean = false;

    record(): void {
        this.val = true;
    }

    readAndReset(): TextBool {
        const current = this.val ? "true" : "false";
        this.val = false;
        return current;
    }
}

class MetricsService {
    public logTransporter: Transport;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor() {
        const logTransporter: Transport = (message: LogMessage) => {
            if (message.level !== "error") {
                return;
            }

            switch (message.scope) {
                case "main":
                    this.hadMainError.record();
                    break;
                case "net":
                case "net/mail":
                case "net/calendar":
                case "net/account":
                    this.hadNetworkError.record();
                    break;
                case "update":
                    this.hadUpdateError.record();
                    break;
            }
        };
        logTransporter.level = "error";
        logTransporter.transforms = [];

        this.logTransporter = logTransporter;
    }

    initialize() {
        this.triggerHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this.triggerHeartbeat();
        }, HEARTBEAT_INTERVAL);
    }

    triggerHeartbeat() {
        if (!this.isListenerReady) {
            mainLogger.info("Skipping heartbeat, listener is not ready");
            return;
        }

        mainLogger.debug("Trigger heartbeat");

        getMailView().webContents.send("hostUpdate", {
            type: "sentHeartbeatMetrics",
            payload: this.readAndClearHeartbeatData(),
        });
    }

    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }

    private hadFailToLoadView: BooleanRecord = new BooleanRecord();
    private hadNetworkError: BooleanRecord = new BooleanRecord();
    private hadMainError: BooleanRecord = new BooleanRecord();
    private hadUpdateError: BooleanRecord = new BooleanRecord();

    recordFailToLoadView = this.hadFailToLoadView.record;

    private readAndClearHeartbeatData(): HttpsProtonMeDesktopInboxHeartbeatTotalV1SchemaJson {
        return {
            Labels: {
                releaseCategory: getSettings().releaseCategory ?? "Stable",
                hadFailToLoadView: this.hadFailToLoadView.readAndReset(),
                hadNetworkError: this.hadNetworkError.readAndReset(),
                hadMainError: this.hadMainError.readAndReset(),
                hadUpdateError: this.hadUpdateError.readAndReset(),
            },
            Value: 1,
        };
    }

    private isListenerReady: boolean = false;
    listenerReady() {
        mainLogger.debug("Metrics listener ready");
        this.isListenerReady = true;
    }

    listenerRemoved() {
        mainLogger.debug("Metrics listener removed");
        this.isListenerReady = false;
    }
}

const metrics = new MetricsService();

export default metrics;
