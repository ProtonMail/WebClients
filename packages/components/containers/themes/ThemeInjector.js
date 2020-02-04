import React, { useState, useEffect } from 'react';
import { useMailSettings, useOrganization } from 'react-components';
import { getThemeIdentifier, getTheme, toStyle, isDarkTheme } from 'proton-shared/lib/themes/helpers';
import { PROTON_THEMES, DEFAULT_THEME } from 'proton-shared/lib/themes/themes';
import { DARK_MODE_CLASS } from 'proton-shared/lib/constants';

const protonThemeIdentifiers = Object.values(PROTON_THEMES).map(({ identifier }) => identifier);

const ThemeInjector = () => {
    const [{ Theme: userTheme = '' } = {}] = useMailSettings();
    const [{ Theme: orgTheme = '' } = {}] = useOrganization();
    const themeIdentifier = getThemeIdentifier(userTheme);
    const [style, setStyle] = useState('');

    useEffect(() => {
        if (themeIdentifier === DEFAULT_THEME.identifier) {
            return setStyle(orgTheme);
        }
        if (protonThemeIdentifiers.includes(themeIdentifier)) {
            return setStyle(toStyle([getTheme(themeIdentifier), orgTheme]));
        }
        setStyle(toStyle([userTheme, orgTheme]));
    }, [userTheme, orgTheme]);

    useEffect(() => {
        if (isDarkTheme(userTheme)) {
            document.body.classList.add(DARK_MODE_CLASS);
        } else {
            document.body.classList.remove(DARK_MODE_CLASS);
        }
        return () => {
            document.body.classList.remove(DARK_MODE_CLASS);
        };
    }, [userTheme]);

    return <style>{style}</style>;
};

export default ThemeInjector;
