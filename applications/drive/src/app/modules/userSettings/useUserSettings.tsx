import { useCallback, useMemo } from 'react';

import { useApi } from '@proton/components';
import { queryUpdateUserSettings } from '@proton/shared/lib/api/drive/user';
import type { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import type { UserSortParams } from './sorting';
import { getSetting, parseSetting } from './sorting';
import { useUserSettingsStore } from './store';

export function useUserSettings() {
    const userSettings = useUserSettingsStore((state) => state.userSettings);
    const setSort = useUserSettingsStore((state) => state.setSort);
    const setLayout = useUserSettingsStore((state) => state.setLayout);

    if (!userSettings) {
        throw new Error('Trying to use uninitialized useUserSettings');
    }

    const api = useApi();

    const sort = useMemo(() => parseSetting(userSettings.Sort), [userSettings.Sort]);

    const changeSort = useCallback(
        async (sortParams: UserSortParams) => {
            const sortSetting = getSetting(sortParams);
            if (!sortSetting) {
                return;
            }
            setSort(sortSetting);
            await api(queryUpdateUserSettings({ Sort: sortSetting }));
        },
        [api, setSort]
    );

    const changeLayout = useCallback(
        async (layout: LayoutSetting) => {
            setLayout(layout);
            await api(queryUpdateUserSettings({ Layout: layout }));
        },
        [api, setLayout]
    );

    return {
        sort,
        layout: userSettings.Layout,
        revisionRetentionDays: userSettings.RevisionRetentionDays,
        photoTags: userSettings.PhotoTags,
        changeSort,
        changeLayout,
    };
}
