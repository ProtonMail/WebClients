import { Logger } from './logs';

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
    });

    test('should log debug messages', () => {
        logger.debug('This is a debug message');

        expect(console.log).toHaveBeenCalledTimes(1);
        expect(logger.getLogs()).toContain('This is a debug message');
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
    });

    test('should save logs', () => {
        logger.info('First message');
        logger.info('Second message');

        const logs = logger.getLogs();
        expect(logs).toContain('First message');
        expect(logs).toContain('Second message');
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
            data: { type: 'downloadLogs' },
        });
        window.dispatchEvent(event);

        // Assert that downloadLogs has been called
        expect(createElementSpy).toHaveBeenCalled();
    });
});

describe('Logger Iframe', () => {
    let logger: Logger;

    beforeEach(() => {
        Object.defineProperty(window, 'top', { value: {} });
        logger = new Logger('test-logger-iframe');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should post message to parent frame on Ctrl+Shift+H in child frame', () => {
        const spyPostMessage = jest.spyOn(window.parent, 'postMessage');
        logger.debug('test');
        const event = new KeyboardEvent('keydown', {
            key: 'H',
            ctrlKey: true,
            shiftKey: true,
        });
        window.dispatchEvent(event);
        expect(window.self === window.top).toEqual(false);
        expect(spyPostMessage).toHaveBeenCalledWith({ type: 'downloadLogs' }, '*');
    });
});
