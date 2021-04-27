import { useLayoutEffect } from 'react';

import { useUserSettings } from '../../hooks';
import { useTheme } from './ThemeProvider';

const ThemeInjector = () => {
    const [userSettings] = useUserSettings();
    const [, setTheme] = useTheme();
    const themeType = userSettings?.ThemeType;

    useLayoutEffect(() => {
        setTheme(themeType);
    }, [themeType]);

    return null;
};

export default ThemeInjector;
