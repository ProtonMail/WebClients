import { c } from 'ttag';

import { updateThemeType } from '@proton/shared/lib/api/settings';
import { PROTON_THEMES, ThemeTypes } from '@proton/shared/lib/themes/themes';

import { useApi } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import ThemeCards from './ThemeCards';
import { useTheme } from './ThemeProvider';

const ThemesSection = () => {
    const api = useApi();
    const [theme, setTheme] = useTheme();

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        setTheme(newThemeType);
        api(updateThemeType(newThemeType));
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph>{c('Info').t`Choose the look and feel of the application.`}</SettingsParagraph>
            <ThemeCards
                className="flex"
                liClassName="mr-4 mb-4"
                list={PROTON_THEMES}
                themeIdentifier={theme}
                onChange={handleThemeChange}
            />
        </SettingsSectionWide>
    );
};

export default ThemesSection;
