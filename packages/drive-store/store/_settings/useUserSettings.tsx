import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useApi, useDrivePlan } from '@proton/components';
import { queryUpdateUserSettings } from '@proton/shared/lib/api/drive/user';
import { DEFAULT_USER_SETTINGS } from '@proton/shared/lib/drive/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { type PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import type {
    LayoutSetting,
    RevisionRetentionDaysSetting,
    UserSettings,
    UserSettingsResponse,
} from '@proton/shared/lib/interfaces/drive/userSettings';
import useFlag from '@proton/unleash/useFlag';

import type { UserSortParams } from './sorting';
import { getSetting, parseSetting } from './sorting';

const UserSettingsContext = createContext<{
    sort: UserSortParams;
    layout: LayoutSetting;
    revisionRetentionDays: RevisionRetentionDaysSetting;
    photoTags: PhotoTag[];
    photosEnabled: boolean;
    photosWithAlbumsEnabled: boolean;
    changeSort: (sortParams: UserSortParams) => Promise<void>;
    changeLayout: (Layout: LayoutSetting) => Promise<void>;
    changeB2BPhotosEnabled: (B2BPhotosEnabled: boolean) => Promise<void>;
} | null>(null);

export function UserSettingsProvider({
    initialUser,
    initialDriveUserSettings,
    children,
}: {
    children: ReactNode;
    initialUser: UserModel;
    initialDriveUserSettings: UserSettingsResponse;
}) {
    const { isB2B } = useDrivePlan();
    const api = useApi();
    const driveB2BPhotosUpload = useFlag('DriveB2BPhotosUpload');
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');
    const driveAlbumsEnabled = !driveAlbumsDisabled;

    const [userSettings, setUserSettings] = useState<UserSettings>(() => {
        const { UserSettings, Defaults } = initialDriveUserSettings;
        const { hasPaidDrive } = initialUser;
        return Object.entries(UserSettings).reduce((settings, [key, value]) => {
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
    });

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

    const changeB2BPhotosEnabled = useCallback(async (B2BPhotosEnabled: boolean) => {
        setUserSettings((settings) => ({ ...settings, B2BPhotosEnabled }));
        await api(
            queryUpdateUserSettings({
                B2BPhotosEnabled,
            })
        );
    }, []);

    const isPhotosEnabled = !isB2B || !driveB2BPhotosUpload || (driveB2BPhotosUpload && userSettings.B2BPhotosEnabled);
    const isPhotosWithAlbumsEnabled = isPhotosEnabled && driveAlbumsEnabled;

    const value = {
        sort,
        layout: userSettings.Layout,
        revisionRetentionDays: userSettings.RevisionRetentionDays,
        photoTags: userSettings.PhotoTags,
        photosEnabled: isPhotosEnabled,
        photosWithAlbumsEnabled: isPhotosWithAlbumsEnabled,
        changeSort,
        changeLayout,
        changeB2BPhotosEnabled,
    };

    return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export default function useUserSettings() {
    const state = useContext(UserSettingsContext);
    if (!state) {
        throw new Error('Trying to use uninitialized UserSettingsProvider');
    }
    return state;
}
