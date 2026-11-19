import { app } from "electron";
import { getAppURL } from "./store/urlStore";
import { updateDownloaded } from "./update";
import { confirmQuitWithActiveDownloads } from "./utils/downloads";
import { isMac } from "./utils/helpers";
import { setApplicationMenu } from "./utils/menus/menuApplication";
import { createMainWindow, openFirstView, setUpMainWindow } from "./utils/view/viewManagement";
import { getMainWindow } from "./utils/view/viewState";
import { macOSExitEvent, windowsAndLinuxExitEvent } from "./utils/view/windowClose";

/**
 * Creates the main window, wires the modules that depend on it and opens the first view.
 * Only index.ts may import this module: it imports from every layer of the app.
 */
export const startup = async () => {
    const mainWindow = createMainWindow();
    setApplicationMenu();
    setUpMainWindow(mainWindow);

    mainWindow.on("close", (event) => {
        // We don't want to prevent the close event if the update is downloaded
        if (updateDownloaded) {
            return;
        }

        event.preventDefault();

        // Mac close event doesn't quit the app
        if (!isMac && !confirmQuitWithActiveDownloads()) {
            return;
        }

        if (isMac) {
            macOSExitEvent(getMainWindow());
        } else {
            windowsAndLinuxExitEvent(getMainWindow());
        }
    });

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    await new Promise((resolve) => setTimeout(resolve, delay));

    void openFirstView("meet", getAppURL().meet);
};
