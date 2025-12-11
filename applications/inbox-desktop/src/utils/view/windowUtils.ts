import { BrowserWindow } from "electron";

export function isWindowValid(window: BrowserWindow | null): window is BrowserWindow {
    return !!(window && typeof window.isDestroyed === "function" && !window.isDestroyed());
}
