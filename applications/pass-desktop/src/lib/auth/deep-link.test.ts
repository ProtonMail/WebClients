import noop from '@proton/utils/noop';

import type * as DeepLink from './deep-link';

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

describe('deep-link', () => {
    let deepLink: typeof DeepLink;

    beforeEach(() => {
        jest.resetModules();
        (globalThis as any).MAIN_WINDOW_WEBPACK_ENTRY = WEBPACK_ENTRY;
        deepLink = require('./deep-link');
    });

    describe('handleDeepLink', () => {
        test.each([
            ['without data', 'protonpass://login'],
            ['with a legacy fork hash', 'protonpass://login#selector=sel-1&sk=secret-key&v=2'],
        ])('shows the window on an auth callback %s without navigating', (_, url) => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink(url, ctx as any);

            expect(ctx.window.show).toHaveBeenCalledTimes(1);
            expect(ctx.window.loadURL).not.toHaveBeenCalled();
            expect(ctx.window.reload).not.toHaveBeenCalled();
        });

        test('shows the window on every auth callback', () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink('protonpass://login', ctx as any);
            deepLink.handleDeepLink('protonpass://login', ctx as any);

            expect(ctx.window.show).toHaveBeenCalledTimes(2);
        });

        test('ignores urls outside the protonpass protocol', () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink('https://account.proton.me/login#selector=sel-1', ctx as any);

            expect(ctx.window.loadURL).not.toHaveBeenCalled();
            expect(ctx.window.show).not.toHaveBeenCalled();
        });

        test('ignores unhandled protonpass urls', () => {
            const ctx = getMockCtx();
            deepLink.handleDeepLink('protonpass://test', ctx as any);

            expect(ctx.window.loadURL).not.toHaveBeenCalled();
            expect(ctx.window.show).not.toHaveBeenCalled();
        });
    });

    describe('getLoginUrl', () => {
        test('loads the login route of the bundled app with the fork hash', () => {
            expect(deepLink.getLoginUrl('#selector=sel-1&sk=secret-key&v=2')).toBe(
                `${WEBPACK_ENTRY}#/login#selector=sel-1&sk=secret-key&v=2`
            );
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
