import { isWebKit } from '@proton/shared/lib/helpers/browser';

import { getComposerIframeSandbox } from './getComposerIframeSandbox';

jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isWebKit: jest.fn(),
}));

const mockedIsWebKit = isWebKit as jest.Mock;

describe('getComposerIframeSandbox', () => {
    beforeEach(() => {
        mockedIsWebKit.mockReturnValue(false);
    });

    it('always allows same-origin so the parent can drive the editor frame', () => {
        const tokens = getComposerIframeSandbox().split(' ');
        expect(tokens).toContain('allow-same-origin');
    });

    it('does not allow scripts on non-WebKit engines', () => {
        const tokens = getComposerIframeSandbox().split(' ');
        expect(tokens).not.toContain('allow-scripts');
    });

    it('allows popups to open and escape the sandbox for links in the content', () => {
        const tokens = getComposerIframeSandbox().split(' ');
        expect(tokens).toContain('allow-popups');
        expect(tokens).toContain('allow-popups-to-escape-sandbox');
    });

    it('adds allow-scripts on the WebKit engine so the parent receives editor events', () => {
        mockedIsWebKit.mockReturnValue(true);
        const tokens = getComposerIframeSandbox().split(' ');
        expect(tokens).toContain('allow-scripts');
        expect(tokens).toContain('allow-same-origin');
    });
});
