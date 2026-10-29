import { isWebKit } from '@proton/shared/lib/helpers/browser';

import { getIframeSandboxAttributes } from './composer';

jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isWebKit: jest.fn(),
}));

const mockedIsWebKit = isWebKit as jest.Mock;

const getTokens = (isPrint: boolean) => getIframeSandboxAttributes(isPrint).split(' ');

describe('getIframeSandboxAttributes', () => {
    beforeEach(() => {
        mockedIsWebKit.mockReturnValue(false);
    });

    describe('on a non-WebKit engine', () => {
        it('allows same-origin', () => {
            expect(getTokens(false)).toContain('allow-same-origin');
        });

        it('allows popups', () => {
            expect(getTokens(false)).toContain('allow-popups');
        });

        it('allows popups to escape the sandbox', () => {
            expect(getTokens(false)).toContain('allow-popups-to-escape-sandbox');
        });

        it('does not allow scripts', () => {
            expect(getTokens(false)).not.toContain('allow-scripts');
        });

        it('returns exactly the base tokens', () => {
            expect(getIframeSandboxAttributes(false)).toBe(
                'allow-same-origin allow-popups allow-popups-to-escape-sandbox'
            );
        });
    });

    describe('on the WebKit engine', () => {
        beforeEach(() => {
            mockedIsWebKit.mockReturnValue(true);
        });

        it('allows same-origin', () => {
            expect(getTokens(false)).toContain('allow-same-origin');
        });

        it('allows scripts so the parent receives events', () => {
            expect(getTokens(false)).toContain('allow-scripts');
        });

        it('returns the same tokens for Safari, Firefox and Chrome on iOS', () => {
            expect(getIframeSandboxAttributes(false)).toBe(
                'allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-scripts'
            );
        });
    });

    describe('when printing', () => {
        it('allows modals', () => {
            expect(getTokens(true)).toContain('allow-modals');
        });

        it('keeps same-origin', () => {
            expect(getTokens(true)).toContain('allow-same-origin');
        });

        it('does not allow scripts on a non-WebKit engine', () => {
            expect(getTokens(true)).not.toContain('allow-scripts');
        });

        it('allows scripts on the WebKit engine', () => {
            mockedIsWebKit.mockReturnValue(true);
            expect(getTokens(true)).toContain('allow-scripts');
        });
    });

    describe('when not printing', () => {
        it('does not allow modals', () => {
            expect(getTokens(false)).not.toContain('allow-modals');
        });
    });

    describe('tokens that are never allowed', () => {
        beforeEach(() => {
            mockedIsWebKit.mockReturnValue(true);
        });

        it('does not allow forms', () => {
            expect(getTokens(true)).not.toContain('allow-forms');
        });

        it('does not allow pointer lock', () => {
            expect(getTokens(true)).not.toContain('allow-pointer-lock');
        });

        it('does not allow top navigation', () => {
            expect(getTokens(true)).not.toContain('allow-top-navigation');
        });
    });
});
