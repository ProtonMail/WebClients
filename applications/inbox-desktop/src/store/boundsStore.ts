import { BrowserWindow } from "electron";
import Store from "electron-store";
import { ensureWindowIsVisible } from "../utils/view/windowBounds";

interface WindowBounds {
    width: number;
    height: number;
    x: number;
    y: number;
}

export const DEFAULT_WIDTH = 1024;
export const DEFAULT_HEIGHT = 768;

// This minimum width avoids triggering mobile design in calendar view,
// which is around 870 pixels
export const MINIMUM_WIDTH = 900;
export const MINIMUM_HEIGHT = 300;

const DEFAULT_WINDOW_BOUNDS = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: 0,
    y: 0,
} satisfies WindowBounds;

const store = new Store<{ windowBounds: WindowBounds }>();

export const getWindowBounds = () => {
    const windowBounds = store.get("windowBounds", DEFAULT_WINDOW_BOUNDS);
    return ensureWindowIsVisible(windowBounds);
};

export const saveWindowBounds = (window: BrowserWindow) => {
    const newBounds = {
        ...window.getBounds(),
    } satisfies WindowBounds;

    store.set("windowBounds", newBounds);
};
