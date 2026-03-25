import { BrowserWindow, net, powerMonitor, screen } from "electron";
import { mainLogger } from ".";

let networkStatusOnline: boolean | undefined = undefined;
const networkStatusCheckInterval = 30_000; // 30 sec

/**
 * Register app-level system event observers (power monitor, OS lifecycle, display changes).
 * Must be called after app.whenReady(). Has no side effects beyond logging.
 */
export function registerSystemEventLog() {
    powerMonitor.on("suspend", () => mainLogger.info("power-monitor: suspend"));
    powerMonitor.on("resume", () => mainLogger.info("power-monitor: resume"));
    powerMonitor.on("lock-screen", () => mainLogger.info("power-monitor: lock-screen"));
    powerMonitor.on("unlock-screen", () => mainLogger.info("power-monitor: unlock-screen"));

    screen.on("display-added", (_e, display) =>
        mainLogger.info("display-added", display.id, JSON.stringify(display.bounds)),
    );
    screen.on("display-removed", (_e, display) => mainLogger.info("display-removed", display.id));
    screen.on("display-metrics-changed", (_e, display, changedMetrics) =>
        mainLogger.debug("display-metrics-changed", display.id, changedMetrics),
    );

    setInterval(() => {
        const online = net.isOnline();
        if (networkStatusOnline !== online) {
            networkStatusOnline = online;
            mainLogger.info(`network status changed: ${online ? "online" : "offline"}`);
        }
    }, networkStatusCheckInterval);
}

/**
 * Register window-level event observers for the main BrowserWindow.
 * Has no side effects beyond logging.
 */
export function registerWindowEventLog(window: BrowserWindow) {
    window.on("focus", () => mainLogger.debug("window: focus"));
    window.on("blur", () => mainLogger.debug("window: blur"));
}
