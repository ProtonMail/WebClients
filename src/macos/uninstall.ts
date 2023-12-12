import { exec } from "child_process";
import { app } from "electron";
import log from "electron-log/main";
import { join } from "path";
import { isMac } from "../utils/helpers";

export const uninstallProton = () => {
    log.info("Uninstalling ProtonMail");
    app.quit();

    const file = join(process.resourcesPath, "uninstall.sh");

    exec(`sh "${file}"`);
};

export const moveUninstaller = () => {
    if (!isMac) return;

    log.info("Copying uninstaller to Applications folder");
    const file = join(process.resourcesPath, "Uninstall Proton Mail.app");
    if (file) {
        log.info("Uninstaller present, copy to Applications folder");
        exec(`cp -r "${file}" /Applications`);
    }
};
