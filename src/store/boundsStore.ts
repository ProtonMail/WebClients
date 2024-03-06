import { BrowserWindow, Rectangle } from "electron";
import Store from "electron-store";
import { ensureWindowIsVisible } from "../utils/view/windowBounds";

const store = new Store();

export const getWindowBounds = () => {
    // Default width and height
    const defaultWidth = 1024;
    const defaultHeight = 768;

    // Get stored window size and position
    const windowBounds = store.get("windowBounds", {
        width: defaultWidth,
        height: defaultHeight,
        x: undefined,
        y: undefined,
    }) as Rectangle;

    // Ensure the window is fully visible
    return ensureWindowIsVisible(windowBounds);
};

export const saveWindowBounds = (window?: BrowserWindow) => {
    if (!window || window.isFullScreen()) {
        return;
    }

    store.set("windowBounds", window.getBounds());
};
