import { LogLevel } from 'livekit-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardLiveKitLogsToLogger } from './forwardLiveKitLogs';

const mocks = vi.hoisted(() => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    setLogExtension: vi.fn<(extension: (level: LogLevel, message: unknown, context?: object) => void) => void>(),
}));

vi.mock('@protontech/logger', () => ({ logger: mocks.logger }));

vi.mock('livekit-client', () => ({
    LogLevel: { trace: 0, debug: 1, info: 2, warn: 3, error: 4, silent: 5 },
    setLogExtension: mocks.setLogExtension,
}));

const installLiveKitLogExtension = () => {
    forwardLiveKitLogsToLogger();
    return mocks.setLogExtension.mock.calls[0][0];
};

describe('forwardLiveKitLogsToLogger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not persist the per-frame missing key warning', () => {
        const logExtension = installLiveKitLogExtension();

        logExtension(LogLevel.warn, 'skipping decryption due to missing key at index 99');

        expect(mocks.logger.warn).not.toHaveBeenCalled();
    });

    it('persists set shared key with its context', () => {
        const logExtension = installLiveKitLogExtension();

        logExtension(LogLevel.info, 'set shared key', { index: 3 });

        expect(mocks.logger.info).toHaveBeenCalledWith('[livekit] set shared key', { index: 3 });
    });

    it('persists the throttled missing key error', () => {
        const logExtension = installLiveKitLogExtension();

        logExtension(LogLevel.error, 'MissingKey: missing key at index 99 for participant abc');

        expect(mocks.logger.error).toHaveBeenCalledWith(
            '[livekit] MissingKey: missing key at index 99 for participant abc'
        );
    });

    it('persists an Error logged as the message', () => {
        const logExtension = installLiveKitLogExtension();

        logExtension(LogLevel.error, new Error('negotiation timed out'));

        expect(mocks.logger.error).toHaveBeenCalledWith('[livekit] Error: negotiation timed out');
    });

    it('drops context keys that carry IP addresses', () => {
        const logExtension = installLiveKitLogExtension();

        logExtension(LogLevel.info, 'setting remote description', {
            mungedSdp: 'c=IN IP4 192.0.2.1',
            originalSdp: 'c=IN IP4 192.0.2.1',
            sdpType: 'offer',
        });

        expect(mocks.logger.info).toHaveBeenCalledWith('[livekit] setting remote description', { sdpType: 'offer' });
    });
});
