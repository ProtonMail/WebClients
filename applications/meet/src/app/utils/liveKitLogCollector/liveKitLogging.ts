import { LogLevel } from 'livekit-client';

// Similar forbidden list as in meet-desktop
/** @see https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/ */
const FORBIDDEN_REGEXP_LIST = [
    /password/gi,
    /pwd/gi,
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

const FORBIDDEN_LIVEKIT_LOGS = [
    'prepareconnection to',
    'prepared connection to',
    'sending ice candidate',
    'got ice candidate from peer',
    'room moved',
    'key ratcheted event received',
    'setting new key with index',
    'websocket connection closed',
    'websocket error',
    'websocket error while closing',
    'could not prepare connection',
    'auto refetching of region settings failed',
    'error trying to establish signal connection',
    'received unrecoverable error',
    'unsupported data type',
];

/**
 * IPv4 regex from @applications/admin/src/app/utils/isIPv4.ts
 */
const IPV4_REGEX = /((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}/g;

/**
 * IPv6 regex from @applications/admin/src/app/utils/isIPv6.ts
 */
const IPV6_REGEX =
    /(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?/g;

const ICE_UFRAG_PATTERN = /a=ice-ufrag:([^\s\\]+)/gi;
const ICE_PWD_PATTERN = /a=ice-pwd:([^\s\\]+)/gi;
const FINGERPRINT_PATTERN = /a=fingerprint:([^\s\\]+)/gi;

const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const filterAndRedactText = (text: string): string => {
    let result = text;
    const sensitiveValues: string[] = [];

    let match;
    while ((match = ICE_UFRAG_PATTERN.exec(text)) !== null) {
        sensitiveValues.push(match[1]);
    }

    while ((match = ICE_PWD_PATTERN.exec(text)) !== null) {
        sensitiveValues.push(match[1]);
    }

    while ((match = FINGERPRINT_PATTERN.exec(text)) !== null) {
        sensitiveValues.push(match[1]);
    }

    // Remove lines that define ice-ufrag, ice-pwd, and fingerprint
    // Handle both actual line breaks and escaped sequences (\\r\\n) in JSON strings
    result = result.replace(/a=ice-ufrag:[^\r\n\\]*(?:\\r\\n|[\r\n]+)?/g, '');
    result = result.replace(/a=ice-pwd:[^\r\n\\]*(?:\\r\\n|[\r\n]+)?/g, '');
    result = result.replace(/a=fingerprint:[^\r\n\\]*(?:\\r\\n|[\r\n]+)?/g, '');

    // Redact all occurrences of each sensitive value in other lines
    for (const value of sensitiveValues) {
        const escapedValue = escapeRegex(value);
        const valueRegex = new RegExp(escapedValue, 'g');
        result = result.replace(valueRegex, '[REDACTED]');
    }

    // Redact IP addresses
    result = result.replace(IPV4_REGEX, '[REDACTED_IPv4]');
    result = result.replace(IPV6_REGEX, '[REDACTED_IPv6]');

    return result;
};

export const redactLogs = (msg: string, context?: object) => {
    const redactedMsg = filterAndRedactText(msg);

    let redactedContext = context;
    if (context) {
        const contextStr = JSON.stringify(context);
        const filteredContextStr = filterAndRedactText(contextStr);

        try {
            redactedContext = JSON.parse(filteredContextStr);
        } catch {
            redactedContext = context;
        }
    }

    return { msg: redactedMsg, context: redactedContext };
};

export const isLiveKitLogAllowedToSend = (level: LogLevel, msg: string, context?: object) => {
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
