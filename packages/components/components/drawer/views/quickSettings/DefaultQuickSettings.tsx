import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import useEarlyAccess from '@proton/components/hooks/useEarlyAccess';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import type { QuickSettingsReminders } from '@proton/shared/lib/drawer/interfaces';
import { wait } from '@proton/shared/lib/helpers/promise';
import { ThemeModeSetting } from '@proton/shared/lib/themes/constants';
import { PROTON_THEMES_MAP, getThemes } from '@proton/shared/lib/themes/themes';

import ThemeCards from '../../../../containers/themes/ThemeCards';
import { useTheme } from '../../../../containers/themes/ThemeProvider';
import ThemeSyncModeDropdown from '../../../../containers/themes/ThemeSyncModeDropdown';
import useShowThemeSelection from '../../../../hooks/useShowThemeSelection';
import DrawerAppHeadline from '../shared/DrawerAppHeadline';
import DrawerAppSection from '../shared/DrawerAppSection';
import QuickSettingsRemindersSection from './QuickSettingsRemindersSection';
import QuickSettingsSectionRow from './QuickSettingsSectionRow';
import QuickSettingsStorageLimitBanner from './QuickSettingsStorageLimitBanner';

interface Props {
    inAppReminders?: QuickSettingsReminders[];
}

const DefaultQuickSettings = ({ inAppReminders }: Props) => {
    const { information, settings, setTheme, setAutoTheme } = useTheme();
    const themes = getThemes();
    const { createNotification } = useNotifications();
    const showThemeSelection = useShowThemeSelection();

    const earlyAccess = useEarlyAccess();

    const [betaToggleLoading, betaToggleWithLoading] = useLoading(false);

    const handleChangeEarlyAccess = async (e: ChangeEvent<HTMLInputElement>) => {
        const run = async () => {
            await earlyAccess.update(e.target.checked);
            await wait(800);
            window.location.reload();
        };
        void betaToggleWithLoading(run());
    };

    const betaToggleId = 'toggle-early-access';
    const showSyncThemeSelection = hasInboxDesktopFeature('RestrictedThemeSelection')
        ? false
        : settings.Mode === ThemeModeSetting.Auto;
    const showManualThemeSelection = settings.Mode !== ThemeModeSetting.Auto;

    return (
        <>
            {showThemeSelection && (
                <DrawerAppSection className="pb-4">
                    <div>
                        {settings.Mode === ThemeModeSetting.Auto ? (
                            <>
                                <DrawerAppHeadline>{c('Label').t`Theme`}</DrawerAppHeadline>
                            </>
                        ) : (
                            <>
                                <DrawerAppHeadline>
                                    {c('Label').t`Theme`}:
                                    <span
                                        className="color-weak ml-1 text-no-bold"
                                        data-testid="drawer-quick-settings:current-theme"
                                    >
                                        {PROTON_THEMES_MAP[information.theme].label}
                                    </span>
                                </DrawerAppHeadline>
                            </>
                        )}
                    </div>
                    {
                        <QuickSettingsSectionRow
                            label={c('Label').t`Sync with system`}
                            labelInfo={
                                <Info
                                    title={c('Tooltip')
                                        .t`Automatically switch between your preferred themes for day and night in sync with your system’s day and night modes`}
                                />
                            }
                            labelProps={{ htmlFor: 'themeSyncToggle' }}
                            action={
                                <Toggle
                                    id="themeSyncToggle"
                                    className="ml-6"
                                    checked={settings.Mode === ThemeModeSetting.Auto}
                                    onChange={(e) => setAutoTheme(e.target.checked)}
                                    data-testid="drawer-quick-settings:auto-theme-toggle"
                                />
                            }
                            ellipsisOnText={false}
                        />
                    }
                    {showSyncThemeSelection && (
                        <div className="flex *:min-size-auto flex-column gap-4 mt-1">
                            <ThemeSyncModeDropdown
                                mode="light"
                                list={themes}
                                themeIdentifier={settings.LightTheme}
                                onChange={(themeType) => {
                                    setTheme(themeType, ThemeModeSetting.Light);
                                    createNotification({ text: c('Success').t`Preference saved` });
                                }}
                                className="flex-none"
                            />
                            <ThemeSyncModeDropdown
                                mode="dark"
                                list={themes}
                                themeIdentifier={settings.DarkTheme}
                                onChange={(themeType) => {
                                    setTheme(themeType, ThemeModeSetting.Dark);
                                    createNotification({ text: c('Success').t`Preference saved` });
                                }}
                                className="flex-none"
                            />
                        </div>
                    )}
                    {showManualThemeSelection && (
                        <ThemeCards
                            list={themes}
                            themeIdentifier={information.theme}
                            size="medium"
                            onChange={(themeType) => {
                                setTheme(themeType);
                                createNotification({ text: c('Success').t`Preference saved` });
                            }}
                        />
                    )}
                </DrawerAppSection>
            )}

            <DrawerAppSection>
                <QuickSettingsSectionRow
                    labelProps={{ htmlFor: betaToggleId }}
                    label={c('Label').t`Beta Access`}
                    labelInfo={
                        <Info
                            title={c('Info')
                                .t`Try new ${BRAND_NAME} features, updates and products before they are released to the public. This will reload the application`}
                        />
                    }
                    action={
                        <Toggle
                            id={betaToggleId}
                            loading={betaToggleLoading}
                            checked={earlyAccess.value}
                            onChange={handleChangeEarlyAccess}
                            data-testid="drawer-quick-settings:beta-access-toggle"
                        />
                    }
                />
            </DrawerAppSection>

            <QuickSettingsStorageLimitBanner />

            <QuickSettingsRemindersSection inAppReminders={inAppReminders} />
        </>
    );
};

export default DefaultQuickSettings;
