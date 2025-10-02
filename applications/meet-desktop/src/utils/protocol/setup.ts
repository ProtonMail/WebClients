import { isWindows } from "../helpers";
import { registerMailtoApp, unregisterMailtoApp } from "./setup_mailto_windows";

export async function installProtocols() {
    if (!isWindows) {
        return;
    }

    registerMailtoApp();
}

export async function updateProtocols() {
    if (!isWindows) {
        return;
    }

    registerMailtoApp();
}

export async function uninstallProtocols() {
    if (!isWindows) {
        return;
    }

    unregisterMailtoApp();
}
