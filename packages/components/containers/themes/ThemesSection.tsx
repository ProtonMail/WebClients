import { c } from 'ttag';

import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { IcCircleHalfFilled } from '@proton/icons/icons/IcCircleHalfFilled';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { ColorScheme, ThemeModeSetting } from '@proton/shared/lib/themes/constants';
import { getThemes } from '@proton/shared/lib/themes/themes';

import useNotifications from '../../hooks/useNotifications';
import { SettingsIconRow } from '../account/SettingsIconRow';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
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
        <DashboardGrid>
            <DashboardGridSectionHeader
                title={c('Title').t`Theme`}
                subtitle={c('Info').t`Customize the look and feel of ${BRAND_NAME} applications.`}
            />
            <DashboardCard>
                <DashboardCardContent>
                    <SettingsIconRow icon={IcCircleHalfFilled}>
                        <SettingsToggleRow
                            id="themeSyncToggle"
                            label={
                                <>
                                    <SettingsToggleRow.Label>{c('Label').t`Sync with system`}</SettingsToggleRow.Label>
                                    <SettingsToggleRow.Description>
                                        {c('Tooltip')
                                            .t`Automatically switch between your preferred themes for day and night in sync with your system’s day and night modes`}
                                    </SettingsToggleRow.Description>
                                </>
                            }
                            toggle={
                                <SettingsToggleRow.Toggle
                                    checked={settings.Mode === ThemeModeSetting.Auto}
                                    onChange={(e) => {
                                        setAutoTheme(e.target.checked);
                                        notifyPreferenceSaved();
                                    }}
                                />
                            }
                        />
                    </SettingsIconRow>

                    {showSyncThemeSelection && (
                        <>
                            <DashboardCardDivider />
                            <div className="flex flex-nowrap gap-4 flex-column lg:flex-row">
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
                            </div>
                        </>
                    )}
                    {showManualThemeSelection && (
                        <>
                            <DashboardCardDivider />

                            <ThemeCards
                                size="large"
                                list={themes}
                                themeIdentifier={information.theme}
                                onChange={(themeType) => {
                                    setTheme(themeType);
                                    notifyPreferenceSaved();
                                }}
                            />
                        </>
                    )}
                </DashboardCardContent>
            </DashboardCard>
        </DashboardGrid>
    );
};

export default ThemesSection;
