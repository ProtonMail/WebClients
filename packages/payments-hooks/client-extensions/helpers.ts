import type { ThemeTypes } from '@proton/shared/lib/themes/constants';
import type { ThemeInformation } from '@proton/shared/lib/themes/themes';

type Brightness = 'dark' | 'light';
export type ThemeCode = `${ThemeTypes | undefined}-${Brightness}` | undefined;
export type ThemeLike = Pick<ThemeInformation, 'dark'> & Partial<Pick<ThemeInformation, 'theme'>>;

export function getThemeCode(themeLike?: ThemeLike): ThemeCode {
    if (!themeLike) {
        return undefined;
    }

    const brightness: Brightness = themeLike.dark ? 'dark' : 'light';
    return `${themeLike.theme}-${brightness}`;
}
