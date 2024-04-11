import { app, shell } from "electron";
import Logger from "electron-log";
import { join } from "path";
import { isLinux, isMac, isWindows } from "../helpers";

export const openLogFolder = () => {
    try {
        const home = app.getPath("home");
        if (isMac) {
            Logger.info("openLogFolder macOS");
            shell.openPath(join(home, "/Library/Logs/Proton Mail"));
        } else if (isWindows) {
            Logger.info("openLogFolder Windows");
            shell.openPath(join(home, "/AppData/Roaming/Proton Mail/logs"));
        } else if (isLinux) {
            Logger.info("openLogFolder Linux");
            shell.openPath(join(home, "/.config/Proton Mail/logs"));
        }
        Logger.info("openLogFolder, not macOS or Windows");
    } catch (error) {
        Logger.error("openLogFolder", error);
    }
};
