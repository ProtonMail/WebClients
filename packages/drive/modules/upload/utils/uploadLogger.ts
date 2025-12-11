import { Logging } from '../../logging';

const logging = new Logging({
    sentryComponent: 'upload-manager',
});

export const uploadLogger = logging.getLogger('upload-manager');

export const uploadLogDebug = (label: string, rest: string | Record<string, unknown> = '') => {
    uploadLogger.debug(`${label}: ${JSON.stringify(rest)}`);
};

export const uploadLogError = (label: string, error: unknown, extra?: Record<string, unknown>) => {
    const message = error instanceof Error ? error.message : (typeof error === 'object' && error?.toString()) || '';
    uploadLogger.error(`${label}: ${message}${extra ? ` | ${JSON.stringify(extra)}` : ''}`, error);
};
