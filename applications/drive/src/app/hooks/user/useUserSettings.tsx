import { useCallback, useMemo } from 'react';

import { useApi, useDrivePlan } from '@proton/components';
import { queryUpdateUserSettings } from '@proton/shared/lib/api/drive/user';
import type { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import { useFlag } from '@proton/unleash/useFlag';

import type { UserSortParams } from './sorting';
import { getSetting, parseSetting } from './sorting';
import { useUserSettingsStore } from './userSettings.store';

export function useUserSettings() {
    const userSettings = useUserSettingsStore((state) => state.userSettings);
    const setSort = useUserSettingsStore((state) => state.setSort);
    const setLayout = useUserSettingsStore((state) => state.setLayout);
    const setB2BPhotosEnabled = useUserSettingsStore((state) => state.setB2BPhotosEnabled);

    if (!userSettings) {
        throw new Error('Trying to use uninitialized useUserSettings');
    }

    const { isB2B } = useDrivePlan();
    const api = useApi();
    const driveB2BPhotosUpload = useFlag('DriveB2BPhotosUpload');
    const driveAlbumsEnabled = !useFlag('DriveAlbumsDisabled');

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

    const changeB2BPhotosEnabled = useCallback(
        async (enabled: boolean) => {
            setB2BPhotosEnabled(enabled);
            await api(queryUpdateUserSettings({ B2BPhotosEnabled: enabled }));
        },
        [api, setB2BPhotosEnabled]
    );

    const isPhotosEnabled = !isB2B || !driveB2BPhotosUpload || (driveB2BPhotosUpload && userSettings.B2BPhotosEnabled);

    return {
        sort,
        layout: userSettings.Layout,
        revisionRetentionDays: userSettings.RevisionRetentionDays,
        photoTags: userSettings.PhotoTags,
        photosEnabled: isPhotosEnabled,
        photosWithAlbumsEnabled: isPhotosEnabled && driveAlbumsEnabled,
        changeSort,
        changeLayout,
        changeB2BPhotosEnabled,
    };
}
