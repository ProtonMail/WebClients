// eslint-disable-next-line no-restricted-imports
import { logger } from '@proton/shared/lib/logger';

export const MAIL_LOG_COMPONENT = {
    MAILBOX_ACTIONS: 'mailbox-actions',
    API_ERROR: 'mail-api-errors',
    DRAFT_SAVE: 'draft-save',
} as const;

export type MailLogComponent = (typeof MAIL_LOG_COMPONENT)[keyof typeof MAIL_LOG_COMPONENT];

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace' | 'log';

const flatten = (value: unknown, prefix = ''): string[] => {
    if (value === null || value === undefined) {
        return [];
    }

    if (value instanceof Error) {
        return [`${prefix || 'error'}=${value.name}:${value.message}`];
    }

    if (Array.isArray(value)) {
        return [`${prefix}=[${value.join(',')}]`];
    }

    if (typeof value === 'object') {
        return Object.entries(value).flatMap(([key, nested]) => flatten(nested, prefix ? `${prefix}.${key}` : key));
    }

    return prefix ? [`${prefix}=${String(value)}`] : [String(value)];
};

const flattenArgs = (args: unknown[]): string => args.flatMap((arg) => flatten(arg)).join(' ');

const createLogMethod =
    (level: LogLevel) =>
    (component: MailLogComponent, message: string, ...args: unknown[]) => {
        // Not collecting logs: stay silent in prod, but keep errors visible for local debugging
        if (level === 'error' && process.env.NODE_ENV !== 'production') {
            console.log(`[${component}] ${message}`, flattenArgs(args));
            return;
        }
        logger[level](`[${component}] ${message}`, flattenArgs(args));
    };

// The mail loger ensure that all mail-related logs are logged under the 'mail' logger namespace.
// And with a flatten args list to ensure easier to parse and smaller logs
export const mailLogger = {
    debug: createLogMethod('debug'),
    info: createLogMethod('info'),
    warn: createLogMethod('warn'),
    error: createLogMethod('error'),
    trace: createLogMethod('trace'),
    log: createLogMethod('log'),
    isInitialized: () => logger.isInitialized(),
};
