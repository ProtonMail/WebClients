import { LogLevel } from '@protontech/drive-sdk/dist/telemetry';

import { traceError } from '@proton/shared/lib/helpers/sentry';

import { NO_SENTRY_COMPONENT_DEFINED, SentryLogHandler } from './sentryLogHandler';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    traceError: jest.fn(),
}));

const mockTraceError = jest.mocked(traceError);

describe('SentryLogHandler', () => {
    let handler: SentryLogHandler;

    beforeEach(() => {
        handler = new SentryLogHandler();
        jest.clearAllMocks();
    });

    it('should send ERROR logs to Sentry', () => {
        const error = new Error('Test error');
        const logRecord = {
            time: new Date('2023-01-01T10:00:00Z'),
            level: LogLevel.ERROR,
            loggerName: 'test-logger',
            message: 'Something went wrong',
            error,
        };

        handler.log(logRecord);

        expect(mockTraceError).toHaveBeenCalledWith(error, {
            level: 'debug',
            tags: {
                component: NO_SENTRY_COMPONENT_DEFINED,
            },
            extra: {
                logTime: '2023-01-01T10:00:00.000Z',
                logLevel: 'ERROR',
                loggerName: 'test-logger',
                logMessage: 'Something went wrong',
            },
        });
    });

    it('should create Error when no error object provided', () => {
        const logRecord = {
            time: new Date('2023-01-01T10:00:00Z'),
            level: LogLevel.ERROR,
            loggerName: 'api-logger',
            message: 'API request failed',
        };

        handler.log(logRecord);

        expect(mockTraceError).toHaveBeenCalledTimes(1);
        const [errorArg] = mockTraceError.mock.calls[0];
        expect(errorArg).toBeInstanceOf(Error);
        expect(errorArg.message).toBe('API request failed');
    });

    it('should not send non-ERROR logs to Sentry', () => {
        const logRecord = {
            time: new Date(),
            level: LogLevel.INFO,
            loggerName: 'test-logger',
            message: 'This is a warning',
        };

        handler.log(logRecord);

        expect(mockTraceError).not.toHaveBeenCalled();
    });

    it('allows overriding the component tag via constructor', () => {
        handler = new SentryLogHandler('custom-component');
        const logRecord = {
            time: new Date('2023-01-01T11:00:00Z'),
            level: LogLevel.WARNING,
            loggerName: 'custom',
            message: 'warn',
        };

        handler.log(logRecord);

        expect(mockTraceError).toHaveBeenCalledWith(expect.any(Error), {
            level: 'debug',
            tags: {
                component: 'custom-component',
            },
            extra: {
                logTime: '2023-01-01T11:00:00.000Z',
                logLevel: 'WARNING',
                loggerName: 'custom',
                logMessage: 'warn',
            },
        });
    });
});
