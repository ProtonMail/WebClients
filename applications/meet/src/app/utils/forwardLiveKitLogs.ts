import { logger } from '@protontech/logger';
import { LogLevel, setLogExtension } from 'livekit-client';

const LIVEKIT_CONTEXT_KEY_WITH_IP_ADDRESSES = /sdp$/i;

const PER_FRAME_LIVEKIT_MESSAGE_PREFIXES = ['skipping decryption due to missing key'];

const isPerFrameLiveKitMessage = (message: unknown) =>
    typeof message === 'string' && PER_FRAME_LIVEKIT_MESSAGE_PREFIXES.some((prefix) => message.startsWith(prefix));

const persistedLoggerByLiveKitLevel: Partial<Record<LogLevel, typeof logger.info>> = {
    [LogLevel.info]: logger.info,
    [LogLevel.warn]: logger.warn,
    [LogLevel.error]: logger.error,
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
        if (isPerFrameLiveKitMessage(message)) {
            return;
        }
        persistedLoggerByLiveKitLevel[level]?.(`[livekit] ${message}`, ...getLiveKitLoggerArgs(context));
    });
};
