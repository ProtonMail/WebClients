import { execSync } from "node:child_process";

import { DefaultProtocolActual, UNCHECKED_PROTOCOL } from "@proton/shared/lib/desktop/DefaultProtocol";

import { getRegExe } from "./setup_mailto_windows";
import { protocolLogger } from "../log";

export const checkDefaultMailtoClientWindows = (): DefaultProtocolActual => {
    const regExe = getRegExe();
    // Need to check we have class registered
    // spawn reg query HKCU\Software\Classes\ProtonMail.Url.mailto\shell\open\command
    //   should contain `Proton Mail.exe`
    try {
        const result = execSync(
            `"${regExe}" query HKCU\\Software\\Classes\\ProtonMail.Url.mailto\\shell\\open\\command`,
        );
        if (!result.toString().includes("Proton Mail.exe")) {
            protocolLogger.error("ProtonMail.Url.mailto command doesn't have correct exe");
            return UNCHECKED_PROTOCOL;
        }
    } catch (e) {
        protocolLogger.error("Failed to check ProtonMail.Url.mailto class", e);
        return UNCHECKED_PROTOCOL;
    }

    // Need to check we are default mailto associated
    // spawn reg quuery HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\mailto\UserChoice \v ProgId
    //    should be `ProtonMail.Url.mailto`
    //
    // [HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\mailto\UserChoice]
    // "Progid"="ProtonMail.Url.mailto"
    try {
        const result = execSync(
            `"${regExe}" query HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\mailto\\UserChoice /v ProgId`,
        );

        return {
            isDefault: result.toString().includes("ProtonMail.Url.mailto"),
            wasChecked: true,
        };
    } catch (e) {
        protocolLogger.error("Failed to check mailto UserChoice", e);
        return UNCHECKED_PROTOCOL;
    }
};

export const setDefaultMailtoWindows = () => {
    // TODO(jcuth)
    // Cannot set prgramatically! Send signal to GUI and ask user to do it manually.
};
