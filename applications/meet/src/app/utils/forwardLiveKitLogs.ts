import { LogLevel, setLogExtension } from 'livekit-client';

import { meetingLogger } from '@proton/meet/utils/meetingLogger';

const liveKitLogger = meetingLogger.withContext('livekit');

const LIVEKIT_CONTEXT_KEY_WITH_IP_ADDRESSES = /sdp$/i;

const PER_FRAME_LIVEKIT_MESSAGE_PREFIXES = ['skipping decryption due to missing key'];

const isPerFrameLiveKitMessage = (message: unknown) =>
    typeof message === 'string' && PER_FRAME_LIVEKIT_MESSAGE_PREFIXES.some((prefix) => message.startsWith(prefix));

const persistedMethodByLiveKitLevel: Partial<Record<LogLevel, 'info' | 'warn' | 'error'>> = {
    [LogLevel.info]: 'info',
    [LogLevel.warn]: 'warn',
    [LogLevel.error]: 'error',
};

const isPlainObject = (value: unknown): value is object =>
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

const withoutIpAddressKeys = (context: object): Record<string, unknown> =>
    Object.fromEntries(
        Object.entries(context)
            .filter(([key]) => !LIVEKIT_CONTEXT_KEY_WITH_IP_ADDRESSES.test(key))
            .map(([key, value]) => [key, isPlainObject(value) ? withoutIpAddressKeys(value) : value])
    );

const getLiveKitLoggerArgs = (context: object = {}) => {
    const { error, ...extra } = withoutIpAddressKeys(context);

    return [error, Object.keys(extra).length > 0 ? extra : undefined].filter((arg) => arg !== undefined);
};

export const forwardLiveKitLogsToLogger = () => {
    setLogExtension((level, message, context) => {
        const persistedMethod = persistedMethodByLiveKitLevel[level];
        if (!persistedMethod || isPerFrameLiveKitMessage(message)) {
            return;
        }
        liveKitLogger[persistedMethod](String(message), ...getLiveKitLoggerArgs(context));
    });
};
