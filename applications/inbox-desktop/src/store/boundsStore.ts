import { BrowserWindow, screen } from "electron";
import Store from "electron-store";
import { ensureWindowIsVisible } from "../utils/view/windowBounds";
import { mainLogger } from "../utils/log";

interface WindowBounds {
    maximized: boolean;
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
    maximized: false,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: -1,
    y: -1,
} satisfies WindowBounds;

const store = new Store<{ windowBounds: WindowBounds }>();

export const getWindowBounds = () => {
    const windowBounds = store.get("windowBounds", DEFAULT_WINDOW_BOUNDS);

    if (windowBounds.x === DEFAULT_WINDOW_BOUNDS.x || windowBounds.y === DEFAULT_WINDOW_BOUNDS.y) {
        const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
        windowBounds.x = currentDisplay.workArea.width / 2 - windowBounds.width / 2;
        windowBounds.y = currentDisplay.workArea.height / 2 - windowBounds.height / 2;
    }

    return {
        ...windowBounds,
        ...ensureWindowIsVisible(windowBounds),
    };
};

export const saveWindowBounds = (browserWindow: BrowserWindow) => {
    const newBounds = {
        ...browserWindow.getBounds(),
        maximized: browserWindow.isMaximized(),
    } satisfies WindowBounds;

    mainLogger.info("update window bounds", JSON.stringify(newBounds));
    store.set("windowBounds", newBounds);
};
