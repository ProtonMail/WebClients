import { isMac, isWindows, isLinux } from "../helpers";
import { protocolLogger } from "../log";
import { DefaultProtocol, DefaultProtocolActual } from "@proton/shared/lib/desktop/DefaultProtocol";
import { loadDefaultProtocol, storeDefaultProtocol } from "./store";
import { checkDefaultMailtoClientMac, setDefaultMailtoMac } from "./default_mailto_macos";
import { checkDefaultMailtoClientLinux, setDefaultMailtoLinux } from "./default_mailto_linux";
import { checkDefaultMailtoClientWindows, setDefaultMailtoWindows } from "./default_mailto_windows";

export function checkDefaultProtocols() {
    checkDefaultMailto();
}

let defaultMailto: DefaultProtocol = {
    isDefault: false,
    wasChecked: false,
    shouldBeDefault: false,
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
            const shouldUpdateStore = !defaultMailto.wasDefaultInPast;
            defaultMailto.wasDefaultInPast = true;
            if (shouldUpdateStore) {
                storeDefaultProtocol("mailto", defaultMailto);
            }
        }
    }

    protocolLogger.info("App default mailto client status", defaultMailto);
}

export function setDefaultMailtoTelemetryReported(timestamp: number) {
    defaultMailto.lastReport.timestamp = timestamp;
    if (defaultMailto.wasChecked) {
        defaultMailto.lastReport.wasDefault = defaultMailto.isDefault;
    }

    storeDefaultProtocol("mailto", defaultMailto);
}

// setDefaultMailtoApp and OS implementations is currently used, waiting for UX
// decision.
export function setDefaultMailtoApp() {
    protocolLogger.info("Requested to set app as default mailto. Current status:", defaultMailto);

    defaultMailto.shouldBeDefault = true;

    if (isMac) setDefaultMailtoMac();
    if (isLinux) setDefaultMailtoLinux();
    if (isWindows) setDefaultMailtoWindows();

    storeDefaultProtocol("mailto", defaultMailto);
}

export const getDefaultMailto = () => defaultMailto;
