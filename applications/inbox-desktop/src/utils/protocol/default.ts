import { isMac, isWindows, isLinux } from "../helpers";
import { protocolLogger } from "../log";
import { DefaultProtocol, DefaultProtocolActual } from "@proton/shared/lib/desktop/DefaultProtocol";
import { loadDefaultProtocol, storeDefaultProtocol } from "./store";
import { checkDefaultMailtoClientMac, setDefaultMailtoMac } from "./default_mailto_macos";
import { checkDefaultMailtoClientLinux, setDefaultMailtoLinux } from "./default_mailto_linux";
import { checkDefaultMailtoClientWindows, setDefaultMailtoWindows } from "./default_mailto_windows";
import { getAccountView, getMailView } from "../view/viewManagement";
import { DESKTOP_FEATURES } from "../../ipc/ipcConstants";

export function checkDefaultProtocols() {
    checkDefaultMailto();
}

let defaultBannerDismissed = false;
let defaultMailto: DefaultProtocol = {
    isDefault: false,
    wasChecked: false,
    shouldBeDefault: DESKTOP_FEATURES.MailtoUpdate,
    wasDefaultInPast: false,
    lastReport: {
        wasDefault: false,
        timestamp: 0,
    },
};

export function checkDefaultMailto() {
    protocolLogger.debug("Checking default mailto");
    defaultMailto = loadDefaultProtocol("mailto");

    let actualMailto: DefaultProtocolActual = { isDefault: false, wasChecked: false };
    if (isMac) actualMailto = checkDefaultMailtoClientMac();
    if (isLinux) actualMailto = checkDefaultMailtoClientLinux();
    if (isWindows) actualMailto = checkDefaultMailtoClientWindows();

    if (actualMailto.wasChecked) {
        defaultMailto.wasChecked = true;
        defaultMailto.isDefault = actualMailto.isDefault;

        if (actualMailto.isDefault) {
            const shouldUpdateStore = !defaultMailto.wasDefaultInPast || !defaultMailto.shouldBeDefault;
            defaultMailto.wasDefaultInPast = true;
            defaultMailto.shouldBeDefault = true;
            if (shouldUpdateStore) {
                storeDefaultProtocol("mailto", defaultMailto);
            }
        }
    }

    protocolLogger.info("App default mailto client status", defaultMailto);

    getMailView()?.webContents?.send("hostUpdate", {
        type: "defaultMailtoChecked",
        payload: getDefaultMailto(),
    });

    getAccountView()?.webContents?.send("hostUpdate", {
        type: "defaultMailtoChecked",
        payload: getDefaultMailto(),
    });
}

export function setDefaultMailtoTelemetryReported(timestamp: number) {
    defaultMailto.lastReport.timestamp = timestamp;
    if (defaultMailto.wasChecked) {
        defaultMailto.lastReport.wasDefault = defaultMailto.isDefault;
    }

    storeDefaultProtocol("mailto", defaultMailto);
}

export function setShouldCheckDefaultMailtoApp(shouldCheck: boolean) {
    protocolLogger.info("Requested to check if app default mailto. Current status:", shouldCheck);
    defaultMailto.canUpdateDefault = true;
    defaultMailto.shouldBeDefault = shouldCheck;

    storeDefaultProtocol("mailto", defaultMailto);

    getMailView()?.webContents?.send("hostUpdate", {
        type: "defaultMailtoChecked",
        payload: getDefaultMailto(),
    });

    getAccountView()?.webContents?.send("hostUpdate", {
        type: "defaultMailtoChecked",
        payload: getDefaultMailto(),
    });
}

export function setDefaultMailtoApp() {
    protocolLogger.info("Requested to set app as default mailto. Current status:", defaultMailto);

    if (isMac) setDefaultMailtoMac();
    if (isLinux) setDefaultMailtoLinux();
    if (isWindows) setDefaultMailtoWindows();

    checkDefaultMailto();
    defaultMailto.shouldBeDefault = true;
    storeDefaultProtocol("mailto", defaultMailto);
}

export const getDefaultMailtoBannerDismissed = () => {
    return defaultBannerDismissed;
};

export const setDefaultMailtoBannerDismissed = (dismissed: boolean) => {
    defaultBannerDismissed = dismissed;
};

export const getDefaultMailto = () => defaultMailto;
