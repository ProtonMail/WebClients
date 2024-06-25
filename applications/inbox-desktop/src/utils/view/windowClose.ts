import { BrowserWindow, app } from "electron";
import { saveWindowBounds } from "../../store/boundsStore";
import { mainLogger } from "../log";

export const macOSExitEvent = (window: BrowserWindow) => {
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

export const windowsAndLinuxExitEvent = (window: BrowserWindow) => {
    window.hide();
    saveWindowBounds(window);

    // Close the application if all windows are closed
    if (!window.isVisible()) {
        mainLogger.info("close, window not visible on Windows");
        window.destroy();
        app.quit();
    }
};
