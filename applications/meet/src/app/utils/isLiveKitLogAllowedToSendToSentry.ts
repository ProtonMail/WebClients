import { LogLevel } from 'livekit-client';

// Similar forbidden list as in meet-desktop
/** @see https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/ */
const FORBIDDEN_REGEXP_LIST = [
    /password/gi,
    /pwd-/gi,
    /secret/gi,
    /passwd/gi,
    /api_key/gi,
    /apikey/gi,
    /access_token/gi,
    /auth/gi,
    /credentials/gi,
    /privatekey/gi,
    /private_key/gi,
    /token/gi,
];

// These logs could include IP addresses, ports, etc...
const FORBIDDEN_LIVEKIT_LOGS = [
    'prepareconnection to',
    'prepared connection to',
    'sending offer',
    'sending answer',
    'original offer',
    'received server offer',
    'received server answer',
    'not able to set',
    'unable to set',
    'sending ice candidate',
    'got ice candidate from peer',
    'room moved',
    'key ratcheted event received',
    'setting new key with index',
    'decryption error',
    'websocket connection closed',
    'websocket error',
    'websocket error while closing',
    'could not prepare connection',
    'auto refetching of region settings failed',
    'error trying to establish signal connection',
    'received unrecoverable error',
    'unsupported data type',
];

export const isLiveKitLogAllowedToSendToSentry = (level: LogLevel, msg: string, context?: object) => {
    if (level === LogLevel.trace) {
        return false;
    }

    const lowerCaseMsg = msg.toLowerCase();

    for (const forbiddenLog of FORBIDDEN_LIVEKIT_LOGS) {
        if (lowerCaseMsg.includes(forbiddenLog)) {
            return false;
        }
    }

    for (const forbiddenRegex of FORBIDDEN_REGEXP_LIST) {
        const lowerCaseContext = context ? JSON.stringify(context).toLowerCase() : '';
        if (forbiddenRegex.test(lowerCaseMsg) || (lowerCaseContext && forbiddenRegex.test(lowerCaseContext))) {
            return false;
        }
    }

    return true;
};
