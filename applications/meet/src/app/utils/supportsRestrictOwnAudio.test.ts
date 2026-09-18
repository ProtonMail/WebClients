import { getBrowser } from '@proton/shared/lib/helpers/browser';
import { isElectronRuntimeAtLeast } from '@proton/shared/lib/helpers/desktop';

import { supportsRestrictOwnAudio } from './supportsRestrictOwnAudio';

vi.mock('@proton/shared/lib/helpers/browser', () => ({
    getBrowser: vi.fn(),
}));

/* The module reads `isElectronApp` at import time, so these tests cover the browser branch only. */
vi.mock('@proton/shared/lib/helpers/desktop', () => ({
    isElectronApp: false,
    isElectronOnWindows: false,
    isElectronRuntimeAtLeast: vi.fn(),
}));

const mockedGetBrowser = vi.mocked(getBrowser);
const mockedIsElectronRuntimeAtLeast = vi.mocked(isElectronRuntimeAtLeast);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('supportsRestrictOwnAudio', () => {
    it.each([
        // Brave reports a Chrome UA but ua-parser renames it via `navigator.brave`, keeping Chromium's version.
        ['Brave', '153.0.0.0', true],
        ['Brave', '140.0.0.0', false],
        ['Chrome', '141.0.0.0', true],
        ['Chrome', '141.0.7390.55', true],
        ['Chrome', '142.0.0.0', true],
        ['Chrome', '140.0.7339.207', false],
        ['Chromium', '141.0.0.0', true],
        ['Chromium', '140.0.0.0', false],
        ['Edge', '141.0.3537.57', true],
        ['Edge', '140.0.0.0', false],
        ['Opera', '125.0.5763.34', true],
        ['Opera', '124.0.0.0', false],
        ['Firefox', '200.0', false],
        ['Safari', '200.0', false],
    ])('returns %s for %s %s', (name, version, expected) => {
        mockedGetBrowser.mockReturnValue({ name, version, major: version.split('.')[0] });

        expect(supportsRestrictOwnAudio(undefined)).toBe(expected);
    });

    it('returns false when the browser is unknown', () => {
        mockedGetBrowser.mockReturnValue({ name: undefined, major: undefined, version: undefined });

        expect(supportsRestrictOwnAudio(undefined)).toBe(false);
    });

    it('ignores the minimum Electron version outside the desktop app', () => {
        mockedGetBrowser.mockReturnValue({ name: 'Chrome', version: '141.0.0.0', major: '141' });

        expect(supportsRestrictOwnAudio('99.0.0')).toBe(true);
        expect(mockedIsElectronRuntimeAtLeast).not.toHaveBeenCalled();
    });
});
