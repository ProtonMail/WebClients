import type * as IPC from './ipc';

const handlers = vi.hoisted(() => new Map<string, (event: unknown, ...args: any[]) => Promise<any>>());

vi.mock('electron', () => ({ ipcMain: { handle: (channel: string, fn: any) => handlers.set(channel, fn) } }));
vi.mock('../utils/logger', () => {
    const noop = () => {};
    return { default: { log: noop, debug: noop, info: noop, warn: noop, error: noop } };
});

const WEBPACK_ENTRY = 'file:///app/index.html';

const fromPage = (url: string) => ({ senderFrame: { url } });

describe('setupIpcHandler', () => {
    const readClipboard = vi.fn(() => 'clipboard content');

    beforeEach(async () => {
        vi.resetModules();
        handlers.clear();
        readClipboard.mockClear();
        (globalThis as any).MAIN_WINDOW_WEBPACK_ENTRY = WEBPACK_ENTRY;
        const { setupIpcHandler }: typeof IPC = await import('./ipc');
        setupIpcHandler('clipboard:read', readClipboard);
    });

    const call = (sender: unknown) => handlers.get('clipboard:read')?.(sender);

    test('the bundled app can read the clipboard', async () => {
        await expect(call(fromPage(`${WEBPACK_ENTRY}#/u/0`))).resolves.toEqual({
            ok: true,
            result: 'clipboard content',
        });
    });

    test('a company sign-in page loaded in the app cannot read the clipboard', async () => {
        await expect(call(fromPage('https://idp.attacker.com/saml/login'))).resolves.toEqual({
            ok: false,
            error: 'Unauthorized sender',
        });
        expect(readClipboard).not.toHaveBeenCalled();
    });

    describe('when the app is installed in a folder with a % in its name', () => {
        beforeEach(() => {
            (globalThis as any).MAIN_WINDOW_WEBPACK_ENTRY = 'file://C:\\Users\\50%off\\app\\index.html';
        });

        test('the bundled app can read the clipboard', async () => {
            await expect(call(fromPage('file:///C:/Users/50%25off/app/index.html#/u/0'))).resolves.toMatchObject({
                ok: true,
            });
        });

        test('a company sign-in page loaded in the app cannot read the clipboard', async () => {
            await expect(call(fromPage('https://idp.attacker.com/saml/login'))).resolves.toMatchObject({ ok: false });
            expect(readClipboard).not.toHaveBeenCalled();
        });
    });

    describe('when the app is installed in a folder whose name looks percent-encoded', () => {
        beforeEach(() => {
            (globalThis as any).MAIN_WINDOW_WEBPACK_ENTRY = 'file://C:\\Users\\a%41b\\app\\index.html';
        });

        test('the bundled app can read the clipboard', async () => {
            await expect(call(fromPage('file:///C:/Users/a%2541b/app/index.html#/u/0'))).resolves.toMatchObject({
                ok: true,
            });
        });
    });

    test('a call from a frame that is gone is refused', async () => {
        await expect(call({ senderFrame: null })).resolves.toMatchObject({ ok: false });
        expect(readClipboard).not.toHaveBeenCalled();
    });
});
