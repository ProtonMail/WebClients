import { logger } from '@proton/pass/utils/logger';

import { reportNativeMessagingInstall } from './report-install';

jest.mock('@proton/pass/utils/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn() } }));

describe('reportNativeMessagingInstall', () => {
    beforeEach(() => jest.clearAllMocks());

    test('logs each browser outcome in the app logs', () => {
        reportNativeMessagingInstall([
            { browser: 'brave', installed: true, skipped: false },
            { browser: 'chrome', installed: false, skipped: true },
            { browser: 'edge', installed: false, skipped: false, error: 'Operation not permitted (os error 1)' },
        ]);

        expect(logger.info).toHaveBeenCalledTimes(2);
        expect(logger.info).toHaveBeenCalledWith('[NativeMessaging] Installed manifest for brave');
        expect(logger.info).toHaveBeenCalledWith(
            '[NativeMessaging] Install skipped for chrome: browser data folder not found'
        );
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith(
            '[NativeMessaging] Install failed for edge',
            'Operation not permitted (os error 1)'
        );
    });

    test('does not warn when everything installed or was skipped', () => {
        reportNativeMessagingInstall([
            { browser: 'brave', installed: true, skipped: false },
            { browser: 'librewolf', installed: false, skipped: true },
        ]);

        expect(logger.warn).not.toHaveBeenCalled();
    });
});
