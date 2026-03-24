import { LogLevel } from '@protontech/drive-sdk/dist/telemetry';

import { addSentryBreadcrumb, traceError } from '@proton/shared/lib/helpers/sentry';

import { NO_SENTRY_COMPONENT_DEFINED, SentryLogHandler } from './sentryLogHandler';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    addSentryBreadcrumb: jest.fn(),
    traceError: jest.fn(),
}));

const mockAddSentryBreadcrumb = jest.mocked(addSentryBreadcrumb);
const mockTraceError = jest.mocked(traceError);

describe('SentryLogHandler', () => {
    let handler: SentryLogHandler;

    beforeEach(() => {
        handler = new SentryLogHandler();
        jest.clearAllMocks();
    });

    it('should add a breadcrumb for INFO logs without reporting an issue', () => {
        const logRecord = {
            time: new Date('2023-01-01T10:00:00Z'),
            level: LogLevel.INFO,
            loggerName: 'test-logger',
            message: 'Hello',
        };

        handler.log(logRecord);

        expect(mockAddSentryBreadcrumb).toHaveBeenCalledWith({
            category: 'drive.logger',
            message: 'Hello',
            level: 'info',
            timestamp: 1_672_567_200,
            data: {
                component: NO_SENTRY_COMPONENT_DEFINED,
                loggerName: 'test-logger',
                logLevel: 'INFO',
            },
        });
        expect(mockTraceError).not.toHaveBeenCalled();
    });

    it('should add a breadcrumb and send ERROR logs to Sentry', () => {
        const error = new Error('Test error');
        const logRecord = {
            time: new Date('2023-01-01T10:00:00Z'),
            level: LogLevel.ERROR,
            loggerName: 'test-logger',
            message: 'Something went wrong',
            error,
        };

        handler.log(logRecord);

        expect(mockAddSentryBreadcrumb).toHaveBeenCalledWith({
            category: 'drive.logger',
            message: 'Something went wrong',
            level: 'error',
            timestamp: 1_672_567_200,
            data: {
                component: NO_SENTRY_COMPONENT_DEFINED,
                loggerName: 'test-logger',
                logLevel: 'ERROR',
            },
        });
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

    it('should create Error when no error object provided for ERROR', () => {
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
        expect((errorArg as Error).message).toBe('API request failed');
    });
});
