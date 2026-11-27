import { ThemeTypes } from '@proton/theme/constants';
import { PROTON_THEMES_MAP } from '@proton/theme/themes';

export const ONBOARDING_THEMES = [
    ThemeTypes.Duotone,
    ThemeTypes.Carbon,
    ThemeTypes.Monokai,
    ThemeTypes.Snow,
    ThemeTypes.ContrastLight,
    ThemeTypes.Classic,
].map((id) => PROTON_THEMES_MAP[id]);
