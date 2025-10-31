import { LogLevel } from '@protontech/drive-sdk/dist/telemetry';

import { traceError } from '@proton/shared/lib/helpers/sentry';

import { SentryLogHandler } from './sentryLogHandler';

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
                component: 'drive-sdk-log',
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
});
