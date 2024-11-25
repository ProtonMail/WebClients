import { BrowserWindow } from "electron";

export class MenuBarMonitor {
    private static INTERVAL_DELAY = 100;

    private menuBarVisible = false;
    private emitter;
    private intervalId: ReturnType<typeof setInterval> | undefined;

    constructor(private browserWindow: BrowserWindow) {
        this.emitter = new Emitter();

        browserWindow.addListener("hide", this.onWindowHide.bind(this));
        browserWindow.addListener("show", this.onWindowShow.bind(this));

        if (browserWindow.isVisible()) {
            this.menuBarVisible = browserWindow.isMenuBarVisible();
            this.onWindowShow();
        }
    }

    onVisibilityChange(callback: () => void) {
        return this.emitter.addListener(callback);
    }

    private onWindowHide() {
        clearInterval(this.intervalId);
    }

    private onWindowShow() {
        setInterval(() => {
            if (this.browserWindow.isDestroyed()) {
                this.onWindowHide();
                return;
            }

            const menuBarVisible = this.browserWindow.isMenuBarVisible();
            if (menuBarVisible !== this.menuBarVisible) {
                this.menuBarVisible = menuBarVisible;
                this.emitter.trigger();
            }
        }, MenuBarMonitor.INTERVAL_DELAY);
    }
}

class Emitter {
    private listenerMap = new Map<number, () => void>();
    private nextListenerId = 0;

    addListener(callback: () => void) {
        const listenerId = this.nextListenerId++;
        this.listenerMap.set(listenerId, callback);
        return {
            removeListener: () => {
                this.listenerMap.delete(listenerId);
            },
        };
    }

    trigger() {
        for (const listener of this.listenerMap.values()) {
            try {
                listener();
            } catch (_error) {
                // no-op
            }
        }
    }
}
