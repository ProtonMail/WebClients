import { BrowserWindow, Rectangle } from "electron";
import Store from "electron-store";
import { ensureWindowIsVisible } from "../utils/view/windowBounds";
import { updateDownloaded } from "../update";

const store = new Store();

export const DEFAULT_WIDTH = 1024;
export const DEFAULT_HEIGHT = 768;

// This minimum width avoids triggering mobile design in calendar view,
// which is around 870 pixels
export const MINIMUM_WIDTH = 900;
export const MINIMUM_HEIGHT = 300;

export const getWindowBounds = () => {
    // Get stored window size and position
    const windowBounds = store.get("windowBounds", {
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        x: undefined,
        y: undefined,
    }) as Rectangle;

    // Ensure the window is fully visible
    return ensureWindowIsVisible(windowBounds);
};

export const saveWindowBounds = (window?: BrowserWindow) => {
    if (!window || window.isFullScreen() || window.isDestroyed() || updateDownloaded) {
        return;
    }

    store.set("windowBounds", window.getBounds());
};
