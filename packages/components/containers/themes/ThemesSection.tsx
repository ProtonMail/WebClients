import React from 'react';
import { c } from 'ttag';

import { updateThemeType } from 'proton-shared/lib/api/settings';
import { PROTON_THEMES, ThemeTypes } from 'proton-shared/lib/themes/themes';

import { useApi } from '../../hooks';
import { SettingsSectionWide, SettingsParagraph } from '../account';

import ThemeCards from './ThemeCards';
import { useTheme } from './ThemeProvider';

const availableThemes = Object.values(PROTON_THEMES);

const ThemesSection = () => {
    const api = useApi();
    const [theme, setTheme] = useTheme();

    const themes = availableThemes.map(({ identifier, getI18NLabel, src }) => {
        return { identifier, label: getI18NLabel(), src };
    });

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        setTheme(newThemeType);
        api(updateThemeType(newThemeType));
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph>{c('Info').t`Choose the look and feel of the application.`}</SettingsParagraph>
            <ThemeCards
                className="flex"
                liClassName="mr1 mb1"
                list={themes}
                themeIdentifier={theme}
                onChange={handleThemeChange}
            />
        </SettingsSectionWide>
    );
};

export default ThemesSection;
