import type { Transport, LogMessage } from "electron-log";

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
                case "net/meet":
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
        // Placeholder for heartbeat metrics
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
