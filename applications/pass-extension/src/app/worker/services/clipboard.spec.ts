import { setupOffscreenDocument as setupOffscreen } from 'proton-pass-extension/app/worker/offscreen/offscreen.utils';
import { sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { sendSafariMessage as sendSafari } from 'proton-pass-extension/lib/utils/safari';

import { extensionClipboardApi } from './clipboard';

const setBuildTarget = (value: string) => ((global as any).BUILD_TARGET = value);

jest.mock('proton-pass-extension/app/worker/offscreen/offscreen.utils');
jest.mock('proton-pass-extension/lib/message/send-message');
jest.mock('proton-pass-extension/lib/utils/safari');

const navigatorClipboard = { readText: jest.fn(), writeText: jest.fn() };

const onMessage = sendMessage.on as jest.MockedFn<typeof sendMessage.on>;
const setupOffscreenDocument = setupOffscreen as jest.MockedFn<typeof setupOffscreen>;
const sendSafariMessage = sendSafari as jest.MockedFn<typeof sendSafari>;

describe('extensionClipboardApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete (global as any).navigator;
        setBuildTarget('firefox');
    });

    describe('read', () => {
        test('should use `navigator.clipboard` when available', async () => {
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.readText.mockResolvedValue('clipboard-content');

            const result = await extensionClipboardApi.read();
            expect(result).toBe('clipboard-content');
            expect(navigatorClipboard.readText).toHaveBeenCalled();
        });

        test('should fallback to offscreen document on chrome when `navigator.clipboard` fails', async () => {
            setBuildTarget('chrome');
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.readText.mockRejectedValue(new Error());
            setupOffscreenDocument.mockResolvedValue();

            onMessage.mockImplementation(async (_, callback) =>
                callback({
                    type: 'success',
                    content: 'offscreen-content',
                })
            );

            const result = await extensionClipboardApi.read();
            expect(result).toBe('offscreen-content');
            expect(setupOffscreenDocument).toHaveBeenCalledWith('offscreen.html');
        });

        test('should try chrome offscreen when navigator fails when `BUILD_TARGET=chrome`', async () => {
            setBuildTarget('chrome');
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.readText.mockRejectedValue(new Error());
            setupOffscreenDocument.mockResolvedValue(undefined);
            onMessage.mockImplementation(async (_, callback) =>
                callback({
                    type: 'success',
                    content: 'chrome-fallback',
                })
            );

            const result = await extensionClipboardApi.read();
            expect(result).toBe('chrome-fallback');
            expect(setupOffscreenDocument).toHaveBeenCalled();
        });

        test('should use safari bridge when `BUILD_TARGET=safari`', async () => {
            setBuildTarget('safari');
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.readText.mockRejectedValue(new Error());
            sendSafariMessage.mockResolvedValue('safari-content');

            const result = await extensionClipboardApi.read();
            expect(result).toBe('safari-content');
            expect(sendSafariMessage).toHaveBeenCalledWith({ readFromClipboard: {} });
        });

        test('should try safari bridge when navigator fails when `BUILD_TARGET=safari`', async () => {
            setBuildTarget('safari');
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.readText.mockRejectedValue(new Error());
            sendSafariMessage.mockResolvedValue('safari-fallback');

            const result = await extensionClipboardApi.read();
            expect(result).toBe('safari-fallback');
            expect(sendSafariMessage).toHaveBeenCalled();
        });

        test('should return empty string when all strategies fail', async () => {
            setBuildTarget('chrome');
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.readText.mockRejectedValue(new Error());
            setupOffscreenDocument.mockRejectedValue(new Error());

            const result = await extensionClipboardApi.read();
            expect(result).toBe('');
        });
    });

    describe('write', () => {
        test('should use `navigator.clipboard` when available', async () => {
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.writeText.mockResolvedValue(undefined);

            await extensionClipboardApi.write('test-content');
            expect(navigatorClipboard.writeText).toHaveBeenCalledWith('test-content');
        });

        test('should fallback to offscreen when `navigator.clipboard` fails when `BUILD_TARGET=chrome`', async () => {
            setBuildTarget('chrome');
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.writeText.mockRejectedValue(new Error('Permission denied'));
            setupOffscreenDocument.mockResolvedValue(undefined);
            onMessage.mockImplementation(async (_, callback) => callback({ type: 'success' }));

            await extensionClipboardApi.write('test-content');
            expect(setupOffscreenDocument).toHaveBeenCalledWith('offscreen.html');
        });

        test('should use safari bridge when `BUILD_TARGET=safari`', async () => {
            setBuildTarget('safari');
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.writeText.mockRejectedValue(new Error());
            sendSafariMessage.mockResolvedValue(undefined);

            await extensionClipboardApi.write('test-content');
            expect(sendSafariMessage).toHaveBeenCalledWith({ writeToClipboard: { Content: 'test-content' } });
        });

        test('should try chrome offscreen when navigator fails when `BUILD_TARGET=chrome`', async () => {
            setBuildTarget('chrome');
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.writeText.mockRejectedValue(new Error());
            setupOffscreenDocument.mockResolvedValue(undefined);
            onMessage.mockImplementation(async (_, callback) => callback({ type: 'success' }));

            await extensionClipboardApi.write('test-content');
            expect(setupOffscreenDocument).toHaveBeenCalledWith('offscreen.html');
        });

        test('should try safari bridge when navigator fails `BUILD_TARGET=safari`', async () => {
            setBuildTarget('safari');
            (global as any).navigator = { clipboard: navigatorClipboard };
            navigatorClipboard.writeText.mockRejectedValue(new Error());
            sendSafariMessage.mockResolvedValue(undefined);

            await extensionClipboardApi.write('test-content');
            expect(sendSafariMessage).toHaveBeenCalledWith({ writeToClipboard: { Content: 'test-content' } });
        });
    });
});
