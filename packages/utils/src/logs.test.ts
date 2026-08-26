/* eslint-disable no-console */
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { Logger } from './logs';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    traceError: jest.fn(),
}));

const mockTraceError = jest.mocked(traceError);

describe('Logger', () => {
    let logger: Logger;

    beforeEach(() => {
        logger = new Logger('test-logger');
        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
        localStorage.removeItem('test-logger-debug');
    });

    test('should log debug messages if verbose is true', () => {
        localStorage.setItem('test-logger-debug', 'true');
        logger = new Logger('test-logger', 'test-logger-debug');
        logger.debug('This is a debug message');

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(logger.getLogs()).toContain('This is a debug message');
    });

    test('should not log debug messages if verbose is false', () => {
        localStorage.setItem('test-logger-debug', 'false');
        logger = new Logger('test-logger', 'test-logger-debug');
        logger.debug('This is a debug message');

        expect(console.log).toHaveBeenCalledTimes(0);
        expect(logger.getLogs()).not.toContain('This is a debug message');
    });

    test('should log info messages', () => {
        logger.info('This is an info message');

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(logger.getLogs()).toContain('This is an info message');
    });

    test('should log warn messages', () => {
        logger.warn('This is a warn message');

        expect(console.warn).toHaveBeenCalledWith('This is a warn message');
        expect(logger.getLogs()).toContain('This is a warn message');
    });

    test('should log error messages', () => {
        const error = new Error('This is an error message');
        logger.error(error);

        expect(console.error).toHaveBeenCalledWith(error);
        expect(logger.getLogs()).toContain('This is an error message');
    });

    test('should log error messages with no Error object', () => {
        logger.error('This is an error message');

        expect(console.error).toHaveBeenCalledWith('This is an error message');
        expect(logger.getLogs()).toContain('This is an error message');
        expect(mockTraceError).toHaveBeenCalledWith(expect.any(Error), {
            tags: {
                tag: 'test-logger',
            },
        });
    });

    test('should log error messages with Error and extras', () => {
        const error = new Error('This is an error message');
        logger.error(error, 'extra', 123);

        expect(console.error).toHaveBeenCalledWith(error, 'extra', 123);
        expect(logger.getLogs()).toContain('This is an error message');
        expect(mockTraceError).toHaveBeenCalledWith(expect.any(Error), {
            tags: {
                tag: 'test-logger',
            },
            extra: {
                0: 'extra',
                1: 123,
            },
        });
    });

    test('should not log if enabled is false', () => {
        logger.setEnabled(false);
        logger.info('This is an info message');

        expect(console.log).not.toHaveBeenCalled();
        expect(logger.getLogs()).not.toContain('This is an info message');
    });

    test('should not warn if enabled is false', () => {
        logger.setEnabled(false);
        logger.warn('This is a warn message');

        expect(console.warn).not.toHaveBeenCalled();
        expect(logger.getLogs()).not.toContain('This is a warn message');
    });

    test('should not error if enabled is false', () => {
        logger.setEnabled(false);
        logger.error('This is an error message');

        expect(console.error).not.toHaveBeenCalled();
        expect(logger.getLogs()).not.toContain('This is an error message');
    });

    test('should save logs', () => {
        logger.info('First message');
        logger.info('Second message');

        const logs = logger.getLogs();
        expect(logs).toContain('First message');
        expect(logs).toContain('Second message');
    });

    test('should save logs until limit is reached', () => {
        logger = new Logger('test-logger', undefined, 2);
        logger.info('First message');
        logger.info('Second message');
        logger.info('Third message');

        const logs = logger.getLogs();
        expect(logs).not.toContain('First message');
        expect(logs).toContain('Second message');
        expect(logs).toContain('Third message');
    });

    test('should save logs with objects', () => {
        const obj = { hello: 'world', test: true, docs: 123 };
        logger.info('First message');
        logger.info('Second message', obj);

        const logs = logger.getLogs();
        expect(logs).toContain('First message');
        expect(logs).toContain(`Second message hello:world test:true docs:123`);
    });

    test('should clear logs', () => {
        logger.info('First message');
        logger.clearLogs();

        expect(logger.getLogs()).toBe('');
    });

    test('should not add duplicate messages but increase times', () => {
        logger.info('Repeated message');
        logger.info('Repeated message');

        const logs = logger.getLogs();
        expect(logs).toContain('Repeated message');
        expect(
            logs.indexOf(new Date().getFullYear().toString()) !== logs.lastIndexOf(new Date().getFullYear().toString())
        ).toEqual(true);
    });

    test('should download logs', () => {
        const createElementSpy = jest.spyOn(document, 'createElement');

        logger.info('Message to download');
        logger.downloadLogs();

        expect(createElementSpy).toHaveBeenCalled();
        createElementSpy.mockRestore();
    });

    test('should not download logs if not logs', () => {
        const createElementSpy = jest.spyOn(document, 'createElement');

        logger.downloadLogs();

        expect(createElementSpy).not.toHaveBeenCalled();
        createElementSpy.mockRestore();
    });

    test('should call downloadLogs on Ctrl+Shift+H in main frame', () => {
        const createElementSpy = jest.spyOn(document, 'createElement');
        // Simulate Ctrl+Shift+H keydown event
        const event = new KeyboardEvent('keydown', {
            key: 'H',
            ctrlKey: true,
            shiftKey: true,
        });
        window.dispatchEvent(event);

        // Assert that downloadLogs has been called
        expect(createElementSpy).toHaveBeenCalled();
    });

    test('should call downloadLogs on message event in main frame', () => {
        const createElementSpy = jest.spyOn(document, 'createElement');
        // Simulate a message event from a child frame
        const event = new MessageEvent('message', {
            data: { type: '@proton/utils/logs:downloadLogs' },
        });
        window.dispatchEvent(event);

        // Assert that downloadLogs has been called
        expect(createElementSpy).toHaveBeenCalled();
    });

    test('should log report on main frame when receiving message from child frames', () => {
        const err = new Error('test');
        const tag = 'test';
        const event = new MessageEvent('message', {
            data: { type: '@proton/utils/logs:report', tag, args: [err] },
        });
        window.dispatchEvent(event);
        expect(mockTraceError).toHaveBeenCalledWith(err, {
            tags: {
                tag,
            },
            extra: {},
        });
    });

    test('should log report on main frame when receiving message from child frames in the wrong format', () => {
        const err = new Error('test');
        const event = new MessageEvent('message', {
            data: { type: '@proton/utils/logs:report', not: 'good format', args: [err] },
        });
        window.dispatchEvent(event);
        expect(mockTraceError).toHaveBeenCalledWith(
            new Error('@proton/utils/logs:report message does not contain args or is not spreadable'),
            {
                tags: {
                    tag: 'test-logger',
                },
                extra: {},
            }
        );
    });
});
