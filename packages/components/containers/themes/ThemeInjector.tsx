import React, { useState, useEffect, useLayoutEffect } from 'react';
import { PROTON_THEMES, ThemeTypes } from 'proton-shared/lib/themes/themes';
import { DARK_MODE_CLASS } from 'proton-shared/lib/constants';

import { useUserSettings } from '../../hooks';

const getStyle = (themeType: ThemeTypes) => {
    if (themeType === ThemeTypes.Default) {
        return PROTON_THEMES.DEFAULT.theme;
    }

    if (themeType === ThemeTypes.Dark) {
        return PROTON_THEMES.DARK.theme;
    }

    return '';
};

const ThemeInjector = () => {
    const [userSettings] = useUserSettings();
    const { ThemeType } = userSettings;
    const [style, setStyle] = useState(() => getStyle(ThemeType));

    useEffect(() => {
        setStyle(getStyle(ThemeType));
    }, [ThemeType]);

    useLayoutEffect(() => {
        if (ThemeType === ThemeTypes.Dark) {
            document.body.classList.add(DARK_MODE_CLASS);
        } else {
            document.body.classList.remove(DARK_MODE_CLASS);
        }
        return () => {
            document.body.classList.remove(DARK_MODE_CLASS);
        };
    }, [ThemeType]);

    return <style>{style}</style>;
};

export default ThemeInjector;
