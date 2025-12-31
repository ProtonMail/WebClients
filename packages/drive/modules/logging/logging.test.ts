import { ConsoleLogHandler, LogLevel, MemoryLogHandler } from '@protontech/drive-sdk/dist/telemetry';

import { Logging } from './logging';
import { SentryLogHandler } from './sentryLogHandler';

jest.mock('@protontech/drive-sdk/dist/telemetry', () => {
    return {
        LogLevel: {
            DEBUG: 'DEBUG',
            INFO: 'INFO',
            WARNING: 'WARNING',
            ERROR: 'ERROR',
        },
        ConsoleLogHandler: jest.fn().mockImplementation(() => {
            return { log: jest.fn() };
        }),
        MemoryLogHandler: jest.fn().mockImplementation(() => {
            return {
                log: jest.fn(),
                getLogs: jest.fn().mockReturnValue(['log1', 'log2']),
            };
        }),
    };
});

jest.mock('./sentryLogHandler', () => {
    return {
        SentryLogHandler: jest.fn().mockImplementation(() => {
            return { log: jest.fn() };
        }),
    };
});

describe('Logging', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize all log handlers', () => {
        new Logging();

        expect(ConsoleLogHandler).toHaveBeenCalled();
        expect(MemoryLogHandler).toHaveBeenCalled();
        expect(SentryLogHandler).toHaveBeenCalledWith(undefined);
    });

    it('should pass sentryComponent option to SentryLogHandler', () => {
        new Logging({ sentryComponent: 'TestComponent' });

        expect(SentryLogHandler).toHaveBeenCalledWith('TestComponent');
    });

    it('should forward log records to all handlers', () => {
        const logging = new Logging();
        const logRecord = {
            time: new Date(),
            level: LogLevel.INFO,
            loggerName: 'test',
            message: 'test message',
        };

        logging.log(logRecord);

        const consoleHandler = (ConsoleLogHandler as jest.Mock).mock.results[0].value;
        const memoryHandler = (MemoryLogHandler as jest.Mock).mock.results[0].value;
        const sentryHandler = (SentryLogHandler as jest.Mock).mock.results[0].value;

        expect(consoleHandler.log).toHaveBeenCalledWith(logRecord);
        expect(memoryHandler.log).toHaveBeenCalledWith(logRecord);
        expect(sentryHandler.log).toHaveBeenCalledWith(logRecord);
    });

    it('should return logs from memory handler', () => {
        const logging = new Logging();

        const logs = logging.getLogs();

        expect(logs).toEqual(['log1', 'log2']);
    });
});

describe('Logger', () => {
    it('should log with correct level and logger name', () => {
        const logging = new Logging();
        const mockLog = jest.spyOn(logging, 'log');
        const logger = logging.getLogger('test-logger');

        logger.debug('debug message');
        logger.info('info message');
        logger.warn('warning message');
        logger.error('error message');
        logger.error('error with object', new Error('test'));

        expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
                level: LogLevel.DEBUG,
                loggerName: 'test-logger',
                message: 'debug message',
            })
        );

        expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
                level: LogLevel.INFO,
                message: 'info message',
            })
        );

        expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
                level: LogLevel.WARNING,
                message: 'warning message',
            })
        );

        expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
                level: LogLevel.ERROR,
                message: 'error message',
                error: undefined,
            })
        );

        expect(mockLog).toHaveBeenCalledWith(
            expect.objectContaining({
                level: LogLevel.ERROR,
                message: 'error with object',
                error: expect.any(Error),
            })
        );
    });
});
