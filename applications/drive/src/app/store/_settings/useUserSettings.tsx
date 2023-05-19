import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useApi, useGetUser } from '@proton/components';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/drive/userSettings';
import { DEFAULT_USER_SETTINGS } from '@proton/shared/lib/drive/constants';
import { LayoutSetting, UserSettings, UserSettingsResponse } from '@proton/shared/lib/interfaces/drive/userSettings';

import { UserSortParams, getSetting, parseSetting } from './sorting';

const useUserSettingsProvider = () => {
    const api = useApi();
    const getUser = useGetUser();

    const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

    const loadUserSettings = async () => {
        const [{ UserSettings, Defaults }, { hasPaidDrive }] = await Promise.all([
            api<UserSettingsResponse>(queryUserSettings()),
            getUser(),
        ]);
        const userSettingsWithDefaults = Object.entries(UserSettings).reduce((settings, [key, value]) => {
            // In case of user downgrade from paid to free, we want to set the default free user value
            if (key === 'RevisionRetentionDays' && !hasPaidDrive) {
                return {
                    ...settings,
                    RevisionRetentionDays: Defaults.RevisionRetentionDays,
                };
            }
            return {
                ...settings,
                [key]:
                    value ??
                    (Defaults[key as keyof UserSettingsResponse['Defaults']] ||
                        DEFAULT_USER_SETTINGS[key as keyof UserSettingsResponse['UserSettings']]),
            };
        }, {} as UserSettings);

        setUserSettings(userSettingsWithDefaults);
    };

    const sort = useMemo(() => parseSetting(userSettings.Sort), [userSettings.Sort]);

    const changeSort = useCallback(async (sortParams: UserSortParams) => {
        const sortSetting = getSetting(sortParams);
        if (!sortSetting) {
            return;
        }
        setUserSettings((settings) => ({ ...settings, Sort: sortSetting }));
        await api(
            queryUpdateUserSettings({
                Sort: sortSetting,
            })
        );
    }, []);

    const changeLayout = useCallback(async (Layout: LayoutSetting) => {
        setUserSettings((settings) => ({ ...settings, Layout }));
        await api(
            queryUpdateUserSettings({
                Layout,
            })
        );
    }, []);

    return {
        sort,
        layout: userSettings.Layout,
        revisionRetentionDays: userSettings.RevisionRetentionDays,
        loadUserSettings,
        changeSort,
        changeLayout,
    };
};

const UserSettingsContext = createContext<ReturnType<typeof useUserSettingsProvider> | null>(null);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
    const value = useUserSettingsProvider();
    return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export default function useUserSettings() {
    const state = useContext(UserSettingsContext);
    if (!state) {
        throw new Error('Trying to use uninitialized UserSettingsProvider');
    }
    return state;
}
