import { exec } from "child_process";
import { app } from "electron";
import { join } from "path";
import { isMac } from "../utils/helpers";

export const uninstallProton = () => {
    app.quit();

    const file = join(process.resourcesPath, "uninstall.sh");
    exec(`sh "${file}"`);
};

export const moveUninstaller = () => {
    if (!isMac) return;

    const file = join(process.resourcesPath, "Uninstall Proton Mail.app");
    if (file) {
        exec(`mv "${file}" /Applications`);
    }
};
