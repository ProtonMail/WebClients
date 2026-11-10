import { logger } from '@protontech/logger';
import { LogLevel, setLogExtension } from 'livekit-client';

const LIVEKIT_CONTEXT_KEYS_WITH_IP_ADDRESSES = ['mungedSdp', 'originalSdp'];

const PER_FRAME_LIVEKIT_MESSAGE_PREFIXES = ['skipping decryption due to missing key'];

const isPerFrameLiveKitMessage = (message: unknown) =>
    typeof message === 'string' && PER_FRAME_LIVEKIT_MESSAGE_PREFIXES.some((prefix) => message.startsWith(prefix));

const persistedLoggerByLiveKitLevel: Partial<Record<LogLevel, typeof logger.info>> = {
    [LogLevel.info]: logger.info,
    [LogLevel.warn]: logger.warn,
    [LogLevel.error]: logger.error,
};

const getLiveKitLoggerArgs = (context: object = {}) => {
    const { error, ...extra } = Object.fromEntries(
        Object.entries(context).filter(([key]) => !LIVEKIT_CONTEXT_KEYS_WITH_IP_ADDRESSES.includes(key))
    );

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
