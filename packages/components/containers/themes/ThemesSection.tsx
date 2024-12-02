import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useNotifications from '@proton/components/hooks/useNotifications';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { ColorScheme, ThemeModeSetting, getThemes } from '@proton/shared/lib/themes/themes';

import ThemeCards from './ThemeCards';
import { useTheme } from './ThemeProvider';
import ThemeSyncModeCard from './ThemeSyncModeCard';

const ThemesSection = () => {
    const { information, settings, setTheme, setAutoTheme } = useTheme();

    const { createNotification } = useNotifications();
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const themes = getThemes();
    const showSyncThemeSelection = hasInboxDesktopFeature('RestrictedThemeSelection')
        ? false
        : settings.Mode === ThemeModeSetting.Auto;
    const showManualThemeSelection = settings.Mode !== ThemeModeSetting.Auto;

    return (
        <>
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info')
                    .t`Customize the look and feel of ${BRAND_NAME} applications.`}</SettingsParagraph>
            </SettingsSectionWide>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="themeSyncToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Sync with system`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Automatically switch between your preferred themes for day and night in sync with your system’s day and night modes`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="themeSyncToggle"
                        checked={settings.Mode === ThemeModeSetting.Auto}
                        onChange={(e) => {
                            setAutoTheme(e.target.checked);
                            notifyPreferenceSaved();
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            {showSyncThemeSelection && (
                <SettingsSectionWide className="flex mt-6 flex-nowrap gap-4 flex-column lg:flex-row">
                    <ThemeSyncModeCard
                        className="lg:flex-1"
                        mode="light"
                        list={themes}
                        themeIdentifier={settings.LightTheme}
                        onChange={(themeType) => {
                            setTheme(themeType, ThemeModeSetting.Light);
                            notifyPreferenceSaved();
                        }}
                        active={information.colorScheme === ColorScheme.Light}
                    />
                    <ThemeSyncModeCard
                        className="lg:flex-1"
                        mode="dark"
                        list={themes}
                        themeIdentifier={settings.DarkTheme}
                        onChange={(themeType) => {
                            setTheme(themeType, ThemeModeSetting.Dark);
                            notifyPreferenceSaved();
                        }}
                        active={information.colorScheme === ColorScheme.Dark}
                    />
                </SettingsSectionWide>
            )}
            {showManualThemeSelection && (
                <SettingsSectionWide className="mt-6">
                    <ThemeCards
                        size="large"
                        list={themes}
                        themeIdentifier={information.theme}
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
