import noop from '@proton/utils/noop';

import type * as DeepLink from './deep-link';

jest.mock('electron', () => ({ shell: { openExternal: jest.fn(() => Promise.resolve()) } }));
jest.mock('../../utils/logger', () => ({ log: noop, debug: noop, info: noop, warn: noop, error: noop }));

const WEBPACK_ENTRY = 'file:///app/index.html';

const getMockCtx = () => ({
    session: null,
    quitting: false,
    window: {
        loadURL: jest.fn(() => Promise.resolve()),
        reload: jest.fn(),
        show: jest.fn(),
    },
});

const authCallback = (selector: string) => `protonpass://login#selector=${selector}&sk=secret-key&v=2`;

describe('deep-link', () => {
    let deepLink: typeof DeepLink;

    beforeEach(() => {
        jest.resetModules();
        (globalThis as any).MAIN_WINDOW_WEBPACK_ENTRY = WEBPACK_ENTRY;
        deepLink = require('./deep-link');
    });

    describe('handleDeepLink', () => {
        test('consumes an auth callback by loading the login route with the fork hash', async () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink(authCallback('sel-1'), ctx as any);

            expect(ctx.window.loadURL).toHaveBeenCalledTimes(1);
            expect(ctx.window.loadURL).toHaveBeenCalledWith(`${WEBPACK_ENTRY}#/login#selector=sel-1&sk=secret-key&v=2`);
            expect(ctx.window.show).not.toHaveBeenCalled();

            await Promise.resolve();
            expect(ctx.window.reload).toHaveBeenCalledTimes(1);
        });

        test('shows the window instead of re-consuming an already used selector', () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink(authCallback('sel-1'), ctx as any);
            ctx.window.loadURL.mockClear();

            deepLink.handleDeepLink(authCallback('sel-1'), ctx as any);

            expect(ctx.window.loadURL).not.toHaveBeenCalled();
            expect(ctx.window.show).toHaveBeenCalledTimes(1);
        });

        test('recognises any previously consumed selector, not only the most recent', () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink(authCallback('sel-1'), ctx as any);
            deepLink.handleDeepLink(authCallback('sel-2'), ctx as any);
            ctx.window.loadURL.mockClear();

            deepLink.handleDeepLink(authCallback('sel-1'), ctx as any);

            expect(ctx.window.loadURL).not.toHaveBeenCalled();
            expect(ctx.window.show).toHaveBeenCalledTimes(1);
        });

        test('consumes a distinct selector after an earlier login', () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink(authCallback('sel-1'), ctx as any);
            ctx.window.loadURL.mockClear();

            deepLink.handleDeepLink(authCallback('sel-2'), ctx as any);

            expect(ctx.window.loadURL).toHaveBeenCalledWith(`${WEBPACK_ENTRY}#/login#selector=sel-2&sk=secret-key&v=2`);
            expect(ctx.window.show).not.toHaveBeenCalled();
        });

        test('flags deep link support from the test url without touching the window', () => {
            const ctx = getMockCtx();
            expect(deepLink.isDeepLinkSupported()).toBe(false);

            deepLink.handleDeepLink('protonpass://test', ctx as any);

            expect(deepLink.isDeepLinkSupported()).toBe(true);
            expect(ctx.window.loadURL).not.toHaveBeenCalled();
            expect(ctx.window.show).not.toHaveBeenCalled();
        });

        test('ignores an auth callback with no hash', () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink('protonpass://login', ctx as any);

            expect(ctx.window.loadURL).not.toHaveBeenCalled();
            expect(ctx.window.show).not.toHaveBeenCalled();
        });

        test('ignores urls outside the protonpass protocol', () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink('https://account.proton.me/login#selector=sel-1', ctx as any);

            expect(ctx.window.loadURL).not.toHaveBeenCalled();
            expect(ctx.window.show).not.toHaveBeenCalled();
        });

        test('dispatches an auth callback without a selector rather than deduping it', () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink('protonpass://login#sk=secret-key', ctx as any);
            deepLink.handleDeepLink('protonpass://login#sk=secret-key', ctx as any);

            expect(ctx.window.loadURL).toHaveBeenCalledTimes(2);
            expect(ctx.window.show).not.toHaveBeenCalled();
        });
    });

    describe('pickDeepLinkFromArgv', () => {
        test('returns the first protonpass entry', () => {
            expect(
                deepLink.pickDeepLinkFromArgv(['/app/pass', '--flag', 'protonpass://login#a=1', 'protonpass://test'])
            ).toBe('protonpass://login#a=1');
        });

        test('returns undefined when argv holds no deep link', () => {
            expect(deepLink.pickDeepLinkFromArgv(['/app/pass', '--flag'])).toBeUndefined();
        });
    });
});
