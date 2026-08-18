import type { LogLevel } from './types';

/**
 * A single call as it would be made against `Logger`. Kept separate from `LogEntry` (the
 * persisted shape): this is what a caller passes in, before encryption and serialization.
 */
export interface SyntheticLogCall {
    level: LogLevel;
    message: string;
    args: unknown[];
}

const randomID = () => Math.random().toString(36).slice(2, 10);
const randomInt = (max: number) => Math.floor(Math.random() * max);
const pick = <T>(values: readonly T[]): T => values[randomInt(values.length)];

const API_PATHS = [
    '/mail/v4/messages',
    '/mail/v4/messages/read',
    '/mail/v4/conversations',
    '/mail/v4/messages/delete',
    '/core/v4/events/latest',
    '/contacts/v4/contacts',
] as const;

const FOLDERS = ['INBOX', 'ALL_DRAFTS', 'ALL_SENT', 'TRASH', 'SPAM', 'ARCHIVE'] as const;

/**
 * Joins `key=value` pairs. Realistic sizing matters here more than realistic content, since
 * it drives the JSON, crypto and IndexedDB costs the perf suite is trying to measure.
 */
const apiErrorCall = (): SyntheticLogCall => {
    const status = pick([400, 401, 403, 422, 429, 500]);
    return {
        level: 'error',
        message: `${pick(API_PATHS)}/${randomID()}`,
        args: [`status=${status} code=${2000 + status} requestID=${randomID()} elapsedMs=${randomInt(2000)}`],
    };
};

const mailboxActionCall = (): SyntheticLogCall => ({
    level: 'info',
    message: '[mailbox-actions] Move to folder',
    args: [
        `messageID=${randomID()} conversationID=${randomID()} folder=${pick(FOLDERS)} elementsCount=${1 + randomInt(20)}`,
    ],
});

const draftSaveCall = (): SyntheticLogCall => ({
    level: 'debug',
    message: '[draft-save] Autosave completed',
    args: [`draftID=${randomID()} sizeBytes=${500 + randomInt(4000)} attempts=${1 + randomInt(3)}`],
});

/** Error arguments are common in practice and, via their stack, by far the largest payloads. */
const networkErrorCall = (): SyntheticLogCall => ({
    level: 'error',
    message: '[mail-api-errors] Network request failed',
    args: [new Error('Failed to fetch')],
});

/** Weighted so info/debug dominate and errors stay the minority, as in a real session. */
const GENERATORS = [
    apiErrorCall,
    mailboxActionCall,
    mailboxActionCall,
    mailboxActionCall,
    draftSaveCall,
    draftSaveCall,
    networkErrorCall,
];

export const generateSyntheticLogCall = (): SyntheticLogCall => pick(GENERATORS)();

export const generateSyntheticLogCalls = (count: number): SyntheticLogCall[] =>
    Array.from({ length: count }, generateSyntheticLogCall);
