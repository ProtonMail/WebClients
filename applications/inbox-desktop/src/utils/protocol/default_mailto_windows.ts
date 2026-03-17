import { execSync } from "node:child_process";
import { basename } from "node:path";

import { DefaultProtocolActual, UNCHECKED_PROTOCOL } from "@proton/shared/lib/desktop/DefaultProtocol";

import { getRegExe } from "./setup_mailto_windows";
import { protocolLogger } from "../log";
import { shell } from "electron";
import os from "node:os";

export const checkDefaultMailtoClientWindows = (): DefaultProtocolActual => {
    const regExe = getRegExe();
    const exeName = basename(process.execPath);

    // Verify the ProgID class is registered and its command points to our exe
    try {
        const result = execSync(
            `"${regExe}" query HKCU\\Software\\Classes\\ProtonMail.Url.mailto\\shell\\open\\command`,
        );
        if (!result.toString().includes(exeName)) {
            protocolLogger.error("ProtonMail.Url.mailto command doesn't have correct exe");
            return UNCHECKED_PROTOCOL;
        }
    } catch (e) {
        protocolLogger.error("Failed to check ProtonMail.Url.mailto class", e);
        return UNCHECKED_PROTOCOL;
    }

    /* Verify we are the active default by checking the UserChoice keys
    * Windows 11 maintains two:
    - UserChoiceLatest: updated by changing the settings app; supported on newer versions of Windows 11
    - UserChoice: the older hash-protected key; still used on older Windows versions
     */
    const userChoiceKeys = [
        "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\mailto\\UserChoiceLatest\\ProgId",
        "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\mailto\\UserChoice",
    ];

    let wasChecked = false;
    for (const key of userChoiceKeys) {
        try {
            const result = execSync(`"${regExe}" query "${key}" /v ProgId`);
            if (result.toString().includes("ProtonMail.Url.mailto")) {
                return {
                    isDefault: true,
                    wasChecked: true,
                };
            }
            wasChecked = true;
        } catch {
            // Registry key doesn't exist, ignore.
        }
    }

    if (wasChecked)
        return {
            isDefault: false,
            wasChecked: true,
        };

    protocolLogger.error("Failed to check mailto UserChoice");
    return UNCHECKED_PROTOCOL;
};

export const setDefaultMailtoWindows = () => {
    // os.release() returns the kernel version, e.g. "10.0.22621" (Windows 11 22H2).
    // The ms-settings:defaultapps?registeredAppUser= parameter is only available on Windows 11 22H2+.
    // Older builds and Windows 10 get the palin default apps page. Mail should be the first option
    // otherwise the user may need to scroll down and select it.
    const releaseParts = os.release().split(".");
    const buildNumber = parseInt(releaseParts[2], 10);

    if (buildNumber >= 22621) {
        // Windows 11 22H2+; navigate directly to the Proton Mail defaults page (only mailto should be registered).
        shell.openExternal(`ms-settings:defaultapps?registeredAppUser=${encodeURIComponent("ProtonMail")}`);
    } else {
        shell.openExternal("ms-settings:defaultapps");
    }
};
