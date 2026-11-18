import { render } from '@testing-library/react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { ThemeFontFaceSetting, ThemeFontSizeSetting } from '@proton/shared/lib/themes/constants';
import { type ThemeSetting, getDefaultThemeSetting } from '@proton/shared/lib/themes/themes';

import { ThemeInjector } from './ThemeInjector';
import { useTheme } from './ThemeProvider';

vi.mock('@proton/account/userSettings/hooks');
vi.mock('@proton/app-context/useSilentApi', () => ({ useSilentApi: () => vi.fn() }));
vi.mock('@proton/shared/lib/helpers/dom', async () => ({
    ...(await vi.importActual('@proton/shared/lib/helpers/dom')),
    rootFontSize: vi.fn(),
}));
vi.mock('./ThemeProvider');

const mockUseTheme = (settings: ThemeSetting) => {
    vi.mocked(useTheme).mockReturnValue({
        settings,
        addListener: () => () => {},
        setThemeSetting: vi.fn(),
    } as unknown as ReturnType<typeof useTheme>);
};

describe('ThemeInjector', () => {
    const defaultSettings = getDefaultThemeSetting();

    beforeEach(() => {
        vi.mocked(useUserSettings).mockReturnValue([{ Theme: defaultSettings }, false] as unknown as ReturnType<
            typeof useUserSettings
        >);
        vi.mocked(rootFontSize).mockClear();
    });

    it('refreshes the cached root font size when the font size changes', () => {
        mockUseTheme(defaultSettings);
        const { rerender } = render(<ThemeInjector />);
        vi.mocked(rootFontSize).mockClear();

        mockUseTheme({ ...defaultSettings, FontSize: ThemeFontSizeSetting.LARGE });
        rerender(<ThemeInjector />);

        expect(rootFontSize).toHaveBeenCalledWith(true);
    });

    // Atkinson Hyperlegible at the default size raises the root font size to 15
    it('refreshes the cached root font size when the font face changes', () => {
        mockUseTheme(defaultSettings);
        const { rerender } = render(<ThemeInjector />);
        vi.mocked(rootFontSize).mockClear();

        mockUseTheme({ ...defaultSettings, FontFace: ThemeFontFaceSetting.ATKINSON });
        rerender(<ThemeInjector />);

        expect(rootFontSize).toHaveBeenCalledWith(true);
    });
});
