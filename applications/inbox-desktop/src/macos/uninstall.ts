import { exec } from "child_process";
import { app } from "electron";
import { existsSync } from "fs";
import { join } from "path";
import { isMac } from "../utils/helpers";

export const uninstallProton = () => {
    app.quit();

    const file = join(process.resourcesPath, "uninstall.sh");

    exec(`sh "${file}"`);
};

export const moveUninstaller = () => {
    if (!isMac) return;

    // Before 1.0.0 the uninstaller was named "Uninstall Proton Mail.app" and we need to rename it
    const oldInstaller = existsSync("/Applications/Uninstall Proton Mail.app");
    if (oldInstaller) {
        exec(`mv "/Applications/Uninstall Proton Mail.app" "/Applications/Proton Mail Uninstaller.app"`);
        return;
    }

    const file = join(process.resourcesPath, "Proton Mail Uninstaller.app");
    if (file) {
        exec(`cp -r "${file}" /Applications`);
    }
};
