import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

import { protocolLogger } from "../log";

import { DefaultProtocolActual, UNCHECKED_PROTOCOL } from "@proton/shared/lib/desktop/DefaultProtocol";

export const checkDefaultMailtoClientLinux = (): DefaultProtocolActual => {
    try {
        if (!existsSync("/usr/share/applications/proton-mail.desktop")) {
            protocolLogger.error("Missing proton-mail.desktop file");
            return UNCHECKED_PROTOCOL;
        }

        const result = execSync("xdg-mime query default x-scheme-handler/mailto");
        return {
            isDefault: result.toString() == "proton-mail.desktop\n",
            wasChecked: true,
        };
    } catch (e) {
        protocolLogger.error("Cannot check default mailto:", e);
        return UNCHECKED_PROTOCOL;
    }
};

export const setDefaultMailtoLinux = () => {
    // TODO:jcuth
    // check there is .desktop file
    // use xdg to set default
};
