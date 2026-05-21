import { create } from 'zustand';

import { DEFAULT_USER_SETTINGS } from '@proton/shared/lib/drive/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import type {
    LayoutSetting,
    SortSetting,
    UserSettings,
    UserSettingsResponse,
} from '@proton/shared/lib/interfaces/drive/userSettings';

interface UserSettingsStore {
    userSettings: UserSettings | null;
    initialize: (initialUser: UserModel, initialDriveUserSettings: UserSettingsResponse) => void;
    setSort: (sortSetting: SortSetting) => void;
    setLayout: (layout: LayoutSetting) => void;
    setB2BPhotosEnabled: (enabled: boolean) => void;
}

export const useUserSettingsStore = create<UserSettingsStore>()((set) => ({
    userSettings: null,

    initialize: (initialUser, initialDriveUserSettings) => {
        const { UserSettings, Defaults } = initialDriveUserSettings;
        const { hasPaidDrive } = initialUser;
        const settings = Object.entries(UserSettings).reduce((acc, [key, value]) => {
            // In case of user downgrade from paid to free, we want to set the default free user value
            if (key === 'RevisionRetentionDays' && !hasPaidDrive) {
                return { ...acc, RevisionRetentionDays: Defaults.RevisionRetentionDays };
            }
            return {
                ...acc,
                [key]:
                    value ??
                    (Defaults[key as keyof UserSettingsResponse['Defaults']] ||
                        DEFAULT_USER_SETTINGS[key as keyof UserSettingsResponse['UserSettings']]),
            };
        }, {} as UserSettings);
        set({ userSettings: settings });
    },

    setSort: (sortSetting) =>
        set((state) => (state.userSettings ? { userSettings: { ...state.userSettings, Sort: sortSetting } } : state)),

    setLayout: (layout) =>
        set((state) => (state.userSettings ? { userSettings: { ...state.userSettings, Layout: layout } } : state)),

    setB2BPhotosEnabled: (enabled) =>
        set((state) =>
            state.userSettings ? { userSettings: { ...state.userSettings, B2BPhotosEnabled: enabled } } : state
        ),
}));
