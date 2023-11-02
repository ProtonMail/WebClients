import { ChangeEvent } from 'react';

import { c } from 'ttag';

import { Info, Toggle, Tooltip } from '@proton/components/components';
import { ThemeCards, useTheme } from '@proton/components/containers';
import ThemeSyncModeDropdown from '@proton/components/containers/themes/ThemeSyncModeDropdown';
import { useEarlyAccess, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { QuickSettingsReminders } from '@proton/shared/lib/drawer/interfaces';
import { wait } from '@proton/shared/lib/helpers/promise';
import { ColorScheme, PROTON_THEMES_MAP, ThemeModeSetting, getThemes } from '@proton/shared/lib/themes/themes';

import QuickSettingsRemindersSection from './QuickSettingsRemindersSection';
import QuickSettingsSection from './QuickSettingsSection';
import QuickSettingsSectionHeadline from './QuickSettingsSectionHeadline';
import QuickSettingsSectionRow from './QuickSettingsSectionRow';

interface Props {
    inAppReminders?: QuickSettingsReminders[];
}

const DefaultQuickSettings = ({ inAppReminders }: Props) => {
    const { information, settings, setTheme, setAutoTheme } = useTheme();
    const themes = getThemes();
    const { createNotification } = useNotifications();

    const earlyAccess = useEarlyAccess();

    const [betaToggleLoading, betaToggleWithLoading] = useLoading(false);

    const handleChangeEarlyAccess = async (e: ChangeEvent<HTMLInputElement>) => {
        await earlyAccess.update(e.target.checked);
        const run = async () => {
            await wait(800);
            window.location.reload();
        };
        void betaToggleWithLoading(run());
    };

    return (
        <>
            <QuickSettingsSection className="pb-4">
                <div>
                    {settings.Mode === ThemeModeSetting.Auto ? (
                        <>
                            <QuickSettingsSectionHeadline>{c('Label').t`Theme`}</QuickSettingsSectionHeadline>
                        </>
                    ) : (
                        <>
                            <QuickSettingsSectionHeadline>
                                {c('Label').t`Theme`}:
                                <span
                                    className="color-weak ml-1 text-no-bold"
                                    data-testid="drawer-quick-settings:current-theme"
                                >
                                    {PROTON_THEMES_MAP[information.theme].label}
                                </span>
                            </QuickSettingsSectionHeadline>
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
                        action={
                            <Toggle
                                id="themeSyncToggle"
                                className="ml-6"
                                checked={settings.Mode === ThemeModeSetting.Auto}
                                onChange={(e) => setAutoTheme(e.target.checked)}
                                data-testid="drawer-quick-settings:auto-theme-toggle"
                            />
                        }
                    />
                }
                {settings.Mode === ThemeModeSetting.Auto ? (
                    <div className="flex-no-min-children flex-column gap-4 mt-1">
                        <ThemeSyncModeDropdown
                            mode="light"
                            list={themes}
                            themeIdentifier={settings.LightTheme}
                            onChange={(themeType) => {
                                setTheme(themeType, ThemeModeSetting.Light);
                                createNotification({ text: c('Success').t`Preference saved` });
                            }}
                            active={information.colorScheme === ColorScheme.Light}
                            className="flex-item-noflex"
                        />
                        <ThemeSyncModeDropdown
                            mode="dark"
                            list={themes}
                            themeIdentifier={settings.DarkTheme}
                            onChange={(themeType) => {
                                setTheme(themeType, ThemeModeSetting.Dark);
                                createNotification({ text: c('Success').t`Preference saved` });
                            }}
                            active={information.colorScheme === ColorScheme.Dark}
                            className="flex-item-noflex"
                        />
                    </div>
                ) : (
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
            </QuickSettingsSection>

            <Tooltip
                title={c('Info')
                    .t`Try new ${BRAND_NAME} features, updates and products before they are released to the public. This will reload the application`}
            >
                {/* additional div needed for tooltip */}
                <div className="w-full flex-item-noshrink">
                    <QuickSettingsSection>
                        <QuickSettingsSectionRow
                            label={c('Label').t`Beta Access`}
                            action={
                                <Toggle
                                    id="toggle-early-access"
                                    loading={betaToggleLoading}
                                    checked={earlyAccess.value}
                                    onChange={handleChangeEarlyAccess}
                                    data-testid="drawer-quick-settings:beta-access-toggle"
                                />
                            }
                        />
                    </QuickSettingsSection>
                </div>
            </Tooltip>

            <QuickSettingsRemindersSection inAppReminders={inAppReminders} />
        </>
    );
};

export default DefaultQuickSettings;
