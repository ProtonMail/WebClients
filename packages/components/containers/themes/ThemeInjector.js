import React, { useState, useEffect } from 'react';
import { useMailSettings, useOrganization } from 'react-components';
import { getThemeIdentifier } from 'react-components/helpers/themes';
import lightTheme from 'design-system/_sass/pm-styles/_pm-light-theme.scss';
import blueTheme from 'design-system/_sass/pm-styles/_pm-blue-theme.scss';
import { THEMES } from 'proton-shared/lib/constants';

import { toStyle } from '../../helpers/themes';

const {
    DARK: { identifier: darkId },
    LIGHT: { identifier: lightId },
    BLUE: { identifier: blueId }
} = THEMES;

const ThemeInjector = () => {
    const [{ Theme: userTheme = '' } = {}] = useMailSettings();
    const [{ Theme: orgTheme = '' } = {}] = useOrganization();
    const themeId = getThemeIdentifier(userTheme);
    const [style, setStyle] = useState('');

    useEffect(() => {
        if (themeId === darkId) {
            return setStyle(orgTheme);
        }

        if (themeId === lightId) {
            return setStyle(toStyle([lightTheme, orgTheme]));
        }

        if (themeId === blueId) {
            return setStyle(toStyle([blueTheme, orgTheme]));
        }

        setStyle(toStyle([userTheme, orgTheme]));
    }, [userTheme, orgTheme]);

    return <style>{style}</style>;
};

export default ThemeInjector;
