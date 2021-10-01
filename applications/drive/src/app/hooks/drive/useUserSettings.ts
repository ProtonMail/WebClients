import { useContext, useCallback } from 'react';
import { useApi } from '@proton/components';
import { LayoutSetting, SortSetting, UserSettings } from '@proton/shared/lib/interfaces/drive/userSettings';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/drive/userSettings';
import { DEFAULT_USER_SETTINGS } from '@proton/shared/lib/drive/constants';
import { UserSettingsContext } from '../../components/sections/UserSettingsProvider';

type UserSettingsResponse = { UserSettings: Partial<UserSettings> };

const useUserSettings = () => {
    const contextState = useContext(UserSettingsContext);
    const api = useApi();

    if (!contextState) {
        throw new Error('Trying to use uninitialized UserSettingsProvider');
    }

    const [userSettings, setUserSettings] = contextState;

    const loadUserSettings = async () => {
        const { UserSettings } = await api<UserSettingsResponse>(queryUserSettings());

        const userSettingsWithDefaults = Object.entries(UserSettings).reduce((settings, [key, value]) => {
            (settings as any)[key] = value ?? (DEFAULT_USER_SETTINGS as any)[key];
            return settings;
        }, {} as UserSettings);

        setUserSettings(userSettingsWithDefaults);
    };

    const sort = userSettings.Sort;
    const layout = userSettings.Layout;

    const changeLayout = useCallback(async (Layout: LayoutSetting) => {
        setUserSettings((settings) => ({ ...settings, Layout }));
        await api(
            queryUpdateUserSettings({
                Layout,
            })
        );
    }, []);

    const changeSort = useCallback(async (Sort: SortSetting) => {
        setUserSettings((settings) => ({ ...settings, Sort }));
        await api(
            queryUpdateUserSettings({
                Sort,
            })
        );
    }, []);

    return {
        sort,
        layout,
        loadUserSettings,
        changeLayout,
        changeSort,
    };
};

export default useUserSettings;
