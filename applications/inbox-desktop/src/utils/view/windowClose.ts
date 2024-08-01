import { BrowserWindow, Event, app } from "electron";
import { saveWindowBounds } from "../../store/boundsStore";
import { updateDownloaded } from "../../update";
import { isMac, isWindows } from "../helpers";
import { mainLogger } from "../log";

export const macOSExitEvent = (window: BrowserWindow, event: Event) => {
    if (!isMac) {
        return;
    }

    // We don't want to prevent the close event if the update is downloaded
    if (updateDownloaded) {
        return;
    }

    event.preventDefault();
    saveWindowBounds(window);
    if (window.isFullScreen()) {
        mainLogger.info("close, isFullScreen on macOS");
        window.setFullScreen(false);

        window.on("leave-full-screen", () => {
            mainLogger.info("close, leave-full-screen on macOS");
            window.hide();
        });
    } else {
        window.hide();
    }
};

export const windowsExitEvent = (window: BrowserWindow, event: Event) => {
    if (!isWindows) {
        return;
    }

    // We don't want to prevent the close event if the update is downloaded
    if (updateDownloaded) {
        return;
    }

    event.preventDefault();
    window.hide();
    saveWindowBounds(window);

    // Close the application if all windows are closed
    if (!window.isVisible()) {
        mainLogger.info("close, window not visible on Windows");
        window.destroy();
        app.quit();
    }
};
