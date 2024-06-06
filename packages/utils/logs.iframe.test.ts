import { Logger } from './logs';

describe('Logger Iframe', () => {
    let logger: Logger;

    beforeEach(() => {
        Object.defineProperty(window, 'top', { value: {} });
        logger = new Logger('test-logger-iframe');
        console.error = jest.fn();
        console.log = jest.fn();
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
        expect(spyPostMessage).toHaveBeenCalledWith({ type: '@proton/utils/logs:downloadLogs' }, '*');
    });

    test('should post message to parent frame on .error() within child frame', () => {
        const spyPostMessage = jest.spyOn(window.parent, 'postMessage');
        const err = new Error('test');
        logger.error(err);
        expect(window.self === window.top).toEqual(false);
        expect(spyPostMessage).toHaveBeenCalledWith(
            { type: '@proton/utils/logs:report', tag: 'test-logger-iframe', args: [err] },
            '*'
        );
    });
});
