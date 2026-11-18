import type { NativeMessagingInstallReport } from '@proton/pass/types/desktop/extension-unlock-with-desktop';
import { logger } from '@proton/pass/utils/logger';

/** Copies the main process install result into the app logs, which users can export. */
export const reportNativeMessagingInstall = (reports: NativeMessagingInstallReport[]) =>
    reports.forEach(({ browser, installed, skipped, error }) => {
        if (error) logger.warn(`[NativeMessaging] Install failed for ${browser}`, error);
        else if (skipped) {
            logger.info(`[NativeMessaging] Install skipped for ${browser}: browser data folder not found`);
        } else if (installed) logger.info(`[NativeMessaging] Installed manifest for ${browser}`);
    });

/** Temporary: until the main process logs reach the app logs. */
export const reportNativeMessagingInstallOnBoot = () =>
    window.ctxBridge
        ?.getNmInstallReport()
        .then(reportNativeMessagingInstall)
        .catch((error) => logger.warn('[NativeMessaging] Could not read the install report', error));
