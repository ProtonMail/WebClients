import { useContext, useCallback, useMemo } from 'react';

import { useApi } from '@proton/components';
import { LayoutSetting, UserSettings } from '@proton/shared/lib/interfaces/drive/userSettings';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/drive/userSettings';
import { DEFAULT_USER_SETTINGS } from '@proton/shared/lib/drive/constants';
import { DriveSectionSortKeys, SortParams } from '@proton/shared/lib/interfaces/drive/link';

import { UserSettingsContext } from '../../components/sections/UserSettingsProvider';
import userSettingsParser from '../../utils/userSettingsParser/userSettingsParser';

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
    const sortSetting = useMemo(() => userSettingsParser.sorting.parseSetting(sort), [sort]);

    const changeLayout = useCallback(async (Layout: LayoutSetting) => {
        setUserSettings((settings) => ({ ...settings, Layout }));
        await api(
            queryUpdateUserSettings({
                Layout,
            })
        );
    }, []);

    const changeSort = useCallback(async (sortParams: SortParams<DriveSectionSortKeys>) => {
        const sortSetting = userSettingsParser.sorting.getSetting(sortParams);
        setUserSettings((settings) => ({ ...settings, Sort: sortSetting }));
        await api(
            queryUpdateUserSettings({
                Sort: sortSetting,
            })
        );
    }, []);

    return {
        sort: sortSetting,
        layout,
        loadUserSettings,
        changeLayout,
        changeSort,
    };
};

export default useUserSettings;
