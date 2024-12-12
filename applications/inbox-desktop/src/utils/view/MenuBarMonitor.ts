import { BrowserWindow } from "electron";
import EventEmitter from "node:events";
import { mainLogger } from "../log";

export class MenuBarMonitor {
    private static INTERVAL_DELAY = 100;
    private static EMITTER_EVENT = "menu-bar-visibility-changed";

    private menuBarVisible = false;
    private emitter;
    private intervalId: ReturnType<typeof setInterval> | undefined;

    constructor(private browserWindow: BrowserWindow) {
        this.emitter = new EventEmitter({ captureRejections: true });

        browserWindow.addListener("hide", this.onWindowHide.bind(this));
        browserWindow.addListener("show", this.onWindowShow.bind(this));

        if (browserWindow.isVisible()) {
            this.menuBarVisible = browserWindow.isMenuBarVisible();
            this.onWindowShow();
        }
    }

    onVisibilityChange(callback: () => void) {
        const handler = this.emitter.addListener(MenuBarMonitor.EMITTER_EVENT, callback);

        return {
            removeListener() {
                handler.removeListener(MenuBarMonitor.EMITTER_EVENT, callback);
            },
        };
    }

    private onWindowHide() {
        clearInterval(this.intervalId);
    }

    private onWindowShow() {
        this.intervalId = setInterval(() => {
            if (this.browserWindow.isDestroyed()) {
                this.onWindowHide();
                return;
            }

            const menuBarVisible = this.browserWindow.isMenuBarVisible();
            if (menuBarVisible !== this.menuBarVisible) {
                if (menuBarVisible) {
                    mainLogger.info("Menu bar show");
                } else {
                    mainLogger.info("Menu bar hide");
                }
                this.menuBarVisible = menuBarVisible;
                this.emitter.emit(MenuBarMonitor.EMITTER_EVENT);
            }
        }, MenuBarMonitor.INTERVAL_DELAY);
    }
}
