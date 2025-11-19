import { BrowserWindow, app } from "electron";

export const macOSExitEvent = (window: BrowserWindow) => {
    if (window.isFullScreen()) {
        window.setFullScreen(false);

        window.on("leave-full-screen", () => {
            window.hide();
        });
    } else {
        window.hide();
    }
};

export const windowsAndLinuxExitEvent = (window: BrowserWindow) => {
    window.hide();

    // Close the application if all windows are closed
    if (!window.isVisible()) {
        if (!window.isDestroyed()) {
            window.destroy();
        }

        app.quit();
    }
};
