import { isDuckDuckGo, isSafari } from '@proton/shared/lib/helpers/browser';

import { getComposerIframeSandbox } from './getComposerIframeSandbox';

jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isSafari: jest.fn(),
    isDuckDuckGo: jest.fn(),
}));

const mockedIsSafari = isSafari as jest.Mock;
const mockedIsDuckDuckGo = isDuckDuckGo as jest.Mock;

describe('getComposerIframeSandbox', () => {
    beforeEach(() => {
        mockedIsSafari.mockReturnValue(false);
        mockedIsDuckDuckGo.mockReturnValue(false);
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

    it('adds allow-scripts on Safari for parent-driven portals', () => {
        mockedIsSafari.mockReturnValue(true);
        const tokens = getComposerIframeSandbox().split(' ');
        expect(tokens).toContain('allow-scripts');
        expect(tokens).toContain('allow-same-origin');
    });

    it('adds allow-scripts on DuckDuckGo for parent-driven portals', () => {
        mockedIsDuckDuckGo.mockReturnValue(true);
        const tokens = getComposerIframeSandbox().split(' ');
        expect(tokens).toContain('allow-scripts');
    });
});
