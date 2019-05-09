import React, { useState, useEffect } from 'react';
import { useMailSettings } from 'react-components';
import { getThemeIdentifier } from 'react-components/helpers/themes';
import lightTheme from 'design-system/_sass/pm-styles/_pm-light-theme.scss';
import blueTheme from 'design-system/_sass/pm-styles/_pm-blue-theme.scss';
import { THEMES } from 'proton-shared/lib/constants';

const {
    DARK: { identifier: darkId },
    LIGHT: { identifier: lightId },
    BLUE: { identifier: blueId }
} = THEMES;

const ThemeInjector = () => {
    const [{ Theme }] = useMailSettings();
    const themeId = getThemeIdentifier(Theme);
    const [style, setStyle] = useState(Theme);

    useEffect(() => {
        if (themeId === darkId) {
            return setStyle('');
        }
        if (themeId === lightId) {
            return setStyle(lightTheme.toString());
        }
        if (themeId === blueId) {
            return setStyle(blueTheme.toString());
        }
        setStyle(Theme);
    }, [Theme]);

    return <style>{style}</style>;
};

export default ThemeInjector;
