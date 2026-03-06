import { appendFileSync } from "node:fs";
import { mainLogger } from ".";
import Logger from "electron-log";
import { app, powerMonitor } from "electron";

class QuitTracker {
    private reason = "unknown";
    private hasQuit = false;
    private onBeforeQuit?: () => void;
    private static instance: QuitTracker;

    // Registered immediately on import so these can fire before app.whenReady()
    private constructor() {
        // app.exit() bypasses before-quit, we need to handle it separately;
        process.on("exit", (code) => {
            try {
                appendFileSync(
                    Logger.transports.file.getFile().path,
                    `[${new Date().toISOString}] [info]  (main)         process-exit reason: ${this.reason} (code: ${code})\n`,
                );
            } catch (_) {
                // ignore
            }
        });

        app.on("before-quit", () => {
            if (this.hasQuit) return;
            this.hasQuit = true;
            mainLogger.info(`before-quit reason: ${this.reason}`);
            this.onBeforeQuit?.();
        });
    }

    static getInstance(): QuitTracker {
        if (!QuitTracker.instance) {
            QuitTracker.instance = new QuitTracker();
        }
        return QuitTracker.instance;
    }

    setReason(reason: string) {
        if (this.reason === "unknown") {
            this.reason = reason;
            mainLogger.info(`quit-reason set: ${reason}`);
        }
    }

    setBeforeQuitHandler(handler: () => void) {
        this.onBeforeQuit = handler;
    }

    register() {
        for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"] as const) {
            process.on(signal, () => {
                try {
                    appendFileSync(
                        Logger.transports.file.getFile().path,
                        `[${new Date().toISOString}] [info]  (main)         quit-reason set: ${signal}\n`,
                    );
                } catch (_) {
                    // ignore
                }
                this.reason = signal;
            });
        }

        app.on("render-process-gone", (_e, _wc, details) => {
            this.setReason(`render-crash: ${details.reason} (${details.exitCode})`);
        });

        app.on("child-process-gone", (_e, details) => {
            this.setReason(`child-crash: ${details.reason} (${details.exitCode})`);
        });

        powerMonitor.on("shutdown", () => {
            this.setReason("system-shutdown");
        });
    }
}

export const quitTracker = QuitTracker.getInstance();
