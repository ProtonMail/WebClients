import { DARK_THEMES } from '@proton/shared/lib/themes/themes';

import { useTheme } from './ThemeProvider';

const useIsDarkTheme = () => {
    const [theme] = useTheme();
    return DARK_THEMES.includes(theme);
};

export default useIsDarkTheme;
