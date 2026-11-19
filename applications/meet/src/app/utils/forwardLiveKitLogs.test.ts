import { LogLevel } from 'livekit-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardLiveKitLogsToLogger } from './forwardLiveKitLogs';

const mocks = vi.hoisted(() => {
    const lines: { level: string; message: string; args: unknown[] }[] = [];
    const createRecordingLogger = (prefix = ''): Record<string, unknown> => {
        const record =
            (level: string) =>
            (message: string, ...args: unknown[]) => {
                lines.push({ level, message: `${prefix}${message}`, args });
            };
        return {
            trace: record('trace'),
            debug: record('debug'),
            info: record('info'),
            warn: record('warn'),
            error: record('error'),
            log: record('info'),
            withContext: (context: string) => createRecordingLogger(`${prefix}[${context}] `),
        };
    };
    return {
        lines,
        meetingLogger: createRecordingLogger(),
        setLogExtension: vi.fn<(extension: (level: LogLevel, message: unknown, context?: object) => void) => void>(),
    };
});

vi.mock('@proton/meet/utils/meetingLogger', () => ({ meetingLogger: mocks.meetingLogger }));

vi.mock('livekit-client', () => ({
    LogLevel: { trace: 0, debug: 1, info: 2, warn: 3, error: 4, silent: 5 },
    setLogExtension: mocks.setLogExtension,
}));

const installLiveKitLogExtension = () => {
    forwardLiveKitLogsToLogger();
    return mocks.setLogExtension.mock.calls[0][0];
};

describe('forwardLiveKitLogsToLogger', () => {
    const lines = mocks.lines;
    let logExtension: ReturnType<typeof installLiveKitLogExtension>;

    beforeEach(() => {
        vi.clearAllMocks();
        lines.length = 0;
        logExtension = installLiveKitLogExtension();
    });

    it('does not persist debug lines', () => {
        logExtension(LogLevel.debug, 'sending offer', { offerSdp: 'v=0' });

        expect(lines).toEqual([]);
    });

    it('does not persist the per-frame missing key warning', () => {
        logExtension(LogLevel.warn, 'skipping decryption due to missing key at index 99');

        expect(lines).toEqual([]);
    });

    it('persists set shared key with its context', () => {
        logExtension(LogLevel.info, 'set shared key', { index: 3 });

        expect(lines).toEqual([{ level: 'info', message: '[livekit] set shared key', args: [{ index: 3 }] }]);
    });

    it('persists the throttled missing key error', () => {
        logExtension(LogLevel.error, 'MissingKey: missing key at index 99 for participant abc');

        expect(lines).toEqual([
            { level: 'error', message: '[livekit] MissingKey: missing key at index 99 for participant abc', args: [] },
        ]);
    });

    it('persists an Error logged as the message', () => {
        logExtension(LogLevel.error, new Error('negotiation timed out'));

        expect(lines).toEqual([{ level: 'error', message: '[livekit] Error: negotiation timed out', args: [] }]);
    });

    it('drops context keys that carry IP addresses', () => {
        logExtension(LogLevel.info, 'setting remote description', {
            mungedSdp: 'c=IN IP4 192.0.2.1',
            originalSdp: 'c=IN IP4 192.0.2.1',
            sdpType: 'offer',
        });

        expect(lines).toEqual([
            { level: 'info', message: '[livekit] setting remote description', args: [{ sdpType: 'offer' }] },
        ]);
    });

    it('drops session descriptions nested in the context of a failed negotiation', () => {
        logExtension(LogLevel.error, 'unable to set offer', {
            fields: {
                error: 'Failed to set local offer sdp',
                sdp: 'a=candidate:1 1 udp 2122260223 192.0.2.1 54321 typ host',
                mungedSdp: 'a=candidate:1 1 udp 2122260223 192.0.2.1 54321 typ host',
                remoteSdp: { type: 'answer', sdp: 'a=candidate:1 1 udp 2122260223 198.51.100.1 3478 typ host' },
            },
        });

        expect(lines).toEqual([
            {
                level: 'error',
                message: '[livekit] unable to set offer',
                args: [{ fields: { error: 'Failed to set local offer sdp' } }],
            },
        ]);
    });

    it('keeps the error of a failed munged description', () => {
        const error = new DOMException('Failed to set local offer sdp', 'OperationError');

        logExtension(LogLevel.warn, 'not able to set offer, falling back to unmodified sdp', {
            error,
            mungedSdp: 'c=IN IP4 192.0.2.1',
            originalSdp: 'c=IN IP4 192.0.2.1',
        });

        expect(lines).toEqual([
            {
                level: 'warn',
                message: '[livekit] not able to set offer, falling back to unmodified sdp',
                args: [error],
            },
        ]);
    });

    it('keeps the candidate pair changes of the webrtc stats', () => {
        const stats = { publisher: { route: 'host/udp -> host', candidatePairChanges: 1 } };

        logExtension(LogLevel.info, 'webrtc stats', stats);

        expect(lines).toEqual([{ level: 'info', message: '[livekit] webrtc stats', args: [stats] }]);
    });
});
