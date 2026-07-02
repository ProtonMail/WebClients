import { dialog, shell } from "electron";
import { externalProtocolManager } from "./manager";
import { mainLogger } from "../log";
import { MAIL_APP_NAME } from "@proton/shared/lib/constants";
import { type ProtocolSource } from "@proton/shared/lib/desktop/externalProtocols";
import { t } from "ttag";
import noop from "@proton/utils/noop";
import { sentryReport } from "../sentryReport";
import { normalizeProtocol, validateUrl } from "./validate";

type OpenExternalOptions = {
    url: string;
    source: ProtocolSource;
    requiresUserConfirmation: boolean;
};

async function openExternal({ url, source, requiresUserConfirmation }: OpenExternalOptions) {
    const allowedProtocols = externalProtocolManager.getProtocols(source);

    const validatedUrl = validateUrl({ url });
    if (!validatedUrl) {
        mainLogger.warn("Tried to parse an invalid URL", { url });
        return;
    }

    const parsedProtocol = normalizeProtocol(validatedUrl);

    const isAllowed = allowedProtocols.has(parsedProtocol);

    if (!isAllowed && !requiresUserConfirmation) {
        mainLogger.info("Blocked external url. The protocol is not allowed.");
        sentryReport.reportMessage("Blocked external url. The protocol is not allowed.", {
            level: "warning",
            tags: {
                source,
                url: validatedUrl.toString(),
                protocol: parsedProtocol,
            },
        });
        return;
    }

    // show a confirmation dialog to the user to ask if they want to open the external url.
    if (requiresUserConfirmation && !isAllowed) {
        const { response } = await dialog.showMessageBox({
            buttons: [t`Open external url`, t`Cancel`],
            title: MAIL_APP_NAME,
            message: t`Open external url`,
            detail: t`The protocol ${parsedProtocol} is not allowed. Do you want to open the external url?`,
        });

        if (response !== 0) {
            mainLogger.info("The user canceled the open external url dialog.");
            return;
        }
    }

    await shell.openExternal(validatedUrl.toString()).catch(noop);
}

/**
 * openExternalIPC - Tries to open the given URL if it adheres to the allowed 'ipc' protocols.
 * @param url {string} - The URL to open
 * @returns {Promise<void>}
 */
export async function openExternalIPC(url: string) {
    return openExternal({ url, source: "ipc", requiresUserConfirmation: false });
}

/**
 * openExternalRedirect - Tries to open the given URL if it adheres to the allowed 'redirect' protocols.
 * @param url {string} - The URL to open
 * @returns {Promise<void>}
 */
export async function openExternalRedirect(url: string) {
    return openExternal({ url, source: "redirect", requiresUserConfirmation: true });
}

/**
 * openExternalWithoutSanitization - Open the given URL directly without any limitation on the protocol.
 * @param url {string} - The URL to open
 * @returns {Promise<void>}
 */
export async function openExternalWithoutSanitization(url: string) {
    await shell.openExternal(url).catch(noop);
}
