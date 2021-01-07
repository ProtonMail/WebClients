import React, { useState, createContext, Dispatch, SetStateAction } from 'react';
import { UserSettings } from '../../../interfaces/userSettings';
import { DEFAULT_USER_SETTINGS } from '../../../constants';

export const UserSettingsContext = createContext<[UserSettings, Dispatch<SetStateAction<UserSettings>>] | null>(null);

const UserSettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const userSettingsState = useState<UserSettings>(DEFAULT_USER_SETTINGS);

    return <UserSettingsContext.Provider value={userSettingsState}>{children}</UserSettingsContext.Provider>;
};

export default UserSettingsProvider;
