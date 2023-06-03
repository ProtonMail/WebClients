import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import { PROTON_THEMES, ThemeModeSetting } from '@proton/shared/lib/themes/themes';

import { Info, Toggle, useNotifications } from '../..';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSectionWide,
} from '../account';
import ThemeCards from './ThemeCards';
import { useThemeSetting } from './ThemeSettingProvider';
import ThemeSyncModeCard from './ThemeSyncModeCard';

const ThemesSection = () => {
    const { settings, setTheme, setAutoTheme } = useThemeSetting();

    const { createNotification } = useNotifications();
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    return (
        <>
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info')
                    .t`Customize the look and feel of ${BRAND_NAME} applications.`}</SettingsParagraph>
            </SettingsSectionWide>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="themeSyncToggle" className="text-semibold align-top">
                        <span className="mr-2">{c('Label').t`Synchronize with system`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Automatically switch between your preferred themes for day and night in sync with your system’s day and night modes`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex pt-1">
                    <Toggle
                        id="themeSyncToggle"
                        checked={settings.mode === ThemeModeSetting.Auto}
                        onChange={(e) => {
                            setAutoTheme(e.target.checked);
                            notifyPreferenceSaved();
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            {settings.mode === ThemeModeSetting.Auto ? (
                <SettingsSectionWide className="flex mt-6 flex-nowrap gap-4 on-mobile-flex-column">
                    <ThemeSyncModeCard
                        mode="light"
                        list={PROTON_THEMES}
                        themeIdentifier={settings.lightTheme}
                        onChange={(themeType) => {
                            setTheme(themeType, ThemeModeSetting.Light);
                            notifyPreferenceSaved();
                        }}
                        active={settings.colorScheme === ThemeModeSetting.Light}
                    />
                    <ThemeSyncModeCard
                        mode="dark"
                        list={PROTON_THEMES}
                        themeIdentifier={settings.darkTheme}
                        onChange={(themeType) => {
                            setTheme(themeType, ThemeModeSetting.Dark);
                            notifyPreferenceSaved();
                        }}
                        active={settings.colorScheme === ThemeModeSetting.Dark}
                    />
                </SettingsSectionWide>
            ) : (
                <SettingsSectionWide className="mt-6">
                    <ThemeCards
                        size="large"
                        list={PROTON_THEMES}
                        themeIdentifier={settings.currentTheme}
                        onChange={(themeType) => {
                            setTheme(themeType);
                            notifyPreferenceSaved();
                        }}
                    />
                </SettingsSectionWide>
            )}
        </>
    );
};

export default ThemesSection;
