import { appendFileSync } from "node:fs";
import { mainLogger } from ".";
import Logger from "electron-log";
import { app, powerMonitor, WebContents } from "electron";

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
                    `[${new Date().toISOString()}] [info]  (main)         process-exit reason: ${this.reason} (code: ${code})\n`,
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
        } else {
            // e.g. child process crash followed by renderer crash
            mainLogger.info(`quit-reason additional: ${reason} (primary: ${this.reason})`);
        }
    }

    setBeforeQuitHandler(handler: () => void) {
        this.onBeforeQuit = handler;
    }

    register(getViewName: (webContents: WebContents) => string | null) {
        for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"] as const) {
            process.on(signal, () => {
                try {
                    appendFileSync(
                        Logger.transports.file.getFile().path,
                        `[${new Date().toISOString()}] [info]  (main)         quit-reason set: ${signal}\n`,
                    );
                } catch (_) {
                    // ignore
                }
                this.reason = signal;
            });
        }

        app.on("render-process-gone", (_e, wc, details) => {
            let url: string | undefined;
            try {
                url = wc.getURL();
            } catch {
                /* WebContents may be destroyed */
            }
            mainLogger.error("render-process-gone", {
                reason: details.reason,
                exitCode: details.exitCode,
                view: getViewName(wc),
                url,
            });
            this.setReason(`render-crash: ${details.reason} (${details.exitCode})`);
        });

        app.on("child-process-gone", (_e, details) => {
            mainLogger.error("child-process-gone", {
                type: details.type,
                reason: details.reason,
                exitCode: details.exitCode,
                name: details.name,
            });
            this.setReason(`child-crash: ${details.reason} (${details.exitCode})`);
        });

        powerMonitor.on("shutdown", () => {
            this.setReason("system-shutdown");
        });
    }
}

export const quitTracker = QuitTracker.getInstance();
