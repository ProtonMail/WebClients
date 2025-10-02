import { execSync } from "node:child_process";

import { DefaultProtocolActual, UNCHECKED_PROTOCOL } from "@proton/shared/lib/desktop/DefaultProtocol";

import { getRegExe } from "./setup_mailto_windows";
import { protocolLogger } from "../log";
import { shell } from "electron";
import os from "node:os";

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
    // os.release() returns a string like "10.0.19042" or "10.0.22000" for Windows 11.
    const releaseParts = os.release().split(".");
    const buildNumber = parseInt(releaseParts[2], 10);

    if (buildNumber >= 22000) {
        // Likely Windows 11 – deep link to the app config
        shell.openExternal("ms-settings:defaultapps?registeredAppUser=ProtonMail");
    } else {
        // Windows 10 – deep link using the email category
        shell.openExternal("ms-settings:defaultapps?category=email");
    }
};
