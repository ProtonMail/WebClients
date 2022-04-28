import { createContext, useContext, useCallback, useMemo, useState } from 'react';

import { useApi } from '@proton/components';
import { DEFAULT_USER_SETTINGS } from '@proton/shared/lib/drive/constants';
import { LayoutSetting, UserSettings } from '@proton/shared/lib/interfaces/drive/userSettings';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/drive/userSettings';

import { UserSortParams, parseSetting, getSetting } from './sorting';

type UserSettingsResponse = { UserSettings: Partial<UserSettings> };

const useUserSettingsProvider = () => {
    const api = useApi();

    const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

    const loadUserSettings = async () => {
        const { UserSettings } = await api<UserSettingsResponse>(queryUserSettings());

        const userSettingsWithDefaults = Object.entries(UserSettings).reduce((settings, [key, value]) => {
            (settings as any)[key] = value ?? (DEFAULT_USER_SETTINGS as any)[key];
            return settings;
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
