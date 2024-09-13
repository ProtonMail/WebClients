import { isMac, isWindows, isLinux } from "../helpers";
import { getSettings } from "../../store/settingsStore";
import { protocolLogger } from "../log";
import { DefaultProtocol } from "./types";
import { checkDefaultMailtoClientMac, setDefaultMailtoMac } from "./default_mailto_macos";
import { checkDefaultMailtoClientLinux, setDefaultMailtoLinux } from "./default_mailto_linux";
import { checkDefaultMailtoClientWindows, setDefaultMailtoWindows } from "./default_mailto_windows";

let defaultMailto: DefaultProtocol = {
    isDefault: false,
    isChecked: false,
};

export function checkDefaultProtocols() {
    if (isMac) defaultMailto = checkDefaultMailtoClientMac();
    if (isLinux) defaultMailto = checkDefaultMailtoClientLinux();
    if (isWindows) defaultMailto = checkDefaultMailtoClientWindows();

    if (defaultMailto.isChecked) {
        if (defaultMailto.isDefault) {
            protocolLogger.info("App is default mailto client");
        } else {
            protocolLogger.info("App is not default mailto client");
        }
    }

    // FIXME:jcuth temporary set in settings
    // - for now just storing hidden settings defaultMailto
    // - only works for macos (need to test)
    // - need to implement logic based on UX
    // - probably need to make it with callback for dialogs and errors
    const settings = getSettings();
    if (settings.defaultMailto && !(defaultMailto.isChecked && defaultMailto.isDefault)) {
        if (isMac) setDefaultMailtoMac();
        if (isLinux) setDefaultMailtoLinux();
        if (isWindows) setDefaultMailtoWindows();
    }
}
