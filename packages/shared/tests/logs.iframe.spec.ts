import type { Logger as LoggerClass } from '../lib/logs';

vi.mock('../lib/helpers/browser', async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        getIsIframe: vi.fn(() => true),
    };
});

vi.resetModules();

const { Logger } = await import('../lib/logs');

describe('Logger Iframe', () => {
    let logger: InstanceType<typeof LoggerClass>;

    beforeEach(() => {
        logger = new Logger('test-logger-iframe');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should post message to parent frame on Ctrl+Shift+H in child frame', () => {
        const spyPostMessage = vi.spyOn(window.parent, 'postMessage');
        logger.debug('test');
        const event = new KeyboardEvent('keydown', {
            key: 'H',
            ctrlKey: true,
            shiftKey: true,
        });
        window.dispatchEvent(event);
        expect(spyPostMessage).toHaveBeenCalledWith({ type: '@proton/utils/logs:downloadLogs' }, '*');
    });

    it('should post message to parent frame on .error() within child frame', () => {
        const spyPostMessage = vi.spyOn(window.parent, 'postMessage');
        const err = new Error('test');
        logger.error(err);
        expect(spyPostMessage).toHaveBeenCalledWith(
            { type: '@proton/utils/logs:report', tag: 'test-logger-iframe', args: [err] },
            '*'
        );
    });
});
