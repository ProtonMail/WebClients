import React, { useLayoutEffect } from 'react';
import { PROTON_THEMES, ThemeTypes } from 'proton-shared/lib/themes/themes';

import { useUserSettings } from '../../hooks';
import { useThemeStyle } from './ThemeStyleProvider';

export const getThemeStyle = (themeType: ThemeTypes = ThemeTypes.Default) => {
    const themeStyle = {
        [ThemeTypes.Default]: PROTON_THEMES.DEFAULT.theme,
        [ThemeTypes.Dark]: PROTON_THEMES.DARK.theme,
        [ThemeTypes.Light]: PROTON_THEMES.LIGHT.theme,
        [ThemeTypes.Monokai]: PROTON_THEMES.MONOKAI.theme,
        [ThemeTypes.Contrast]: PROTON_THEMES.CONTRAST.theme,
    }[themeType];
    return themeStyle || PROTON_THEMES.DEFAULT.theme;
};

const ThemeInjector = () => {
    const [userSettings] = useUserSettings();
    const [, setThemeStyle] = useThemeStyle();

    const themeType = userSettings?.ThemeType;

    useLayoutEffect(() => {
        setThemeStyle(getThemeStyle(themeType));
    }, [themeType]);

    return <>{null}</>;
};

export default ThemeInjector;
