import React, { useEffect, useState } from 'react';
import { c } from 'ttag';

import { updateThemeType } from 'proton-shared/lib/api/settings';
import { PROTON_THEMES, ThemeTypes } from 'proton-shared/lib/themes/themes';

import { useUserSettings, useApi } from '../../hooks';
import { SettingsSectionWide, SettingsParagraph } from '../account';

import ThemeCards from './ThemeCards';
import { getThemeStyle } from './ThemeInjector';
import { useThemeStyle } from './ThemeStyleProvider';

const availableThemes = Object.values(PROTON_THEMES);

const ThemesSection = () => {
    const api = useApi();
    const [{ ThemeType: actualThemeType }] = useUserSettings();
    const [themeType, setThemeType] = useState(actualThemeType);
    const [, setThemeStyle] = useThemeStyle();

    useEffect(
        // Updates from event-manager
        () => {
            setThemeType(actualThemeType);
        },
        [actualThemeType]
    );

    const themes = availableThemes.map(({ identifier, getI18NLabel, src }) => {
        return { identifier, label: getI18NLabel(), src };
    });

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        setThemeType(newThemeType);
        setThemeStyle(getThemeStyle(newThemeType));
        api(updateThemeType(newThemeType));
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph>{c('Info').t`Choose the look and feel of the application.`}</SettingsParagraph>
            <ThemeCards list={themes} themeIdentifier={themeType} onChange={handleThemeChange} />
        </SettingsSectionWide>
    );
};

export default ThemesSection;
