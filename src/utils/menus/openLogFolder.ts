import { app, shell } from "electron";
import log from "electron-log/main";
import { join } from "path";
import { isMac, isWindows } from "../helpers";

export const openLogFolder = () => {
    try {
        const home = app.getPath("home");
        if (isMac) {
            log.info("openLogFolder macOS");
            shell.openPath(join(home, "/Library/Logs/Proton Mail"));
        } else if (isWindows) {
            log.info("openLogFolder Windows");
            shell.openPath(join(home, "/AppData/Roaming/Proton Mail/logs"));
        }
        log.info("openLogFolder, not macOS or Windows");
    } catch (error) {
        log.error("openLogFolder", error);
    }
};
