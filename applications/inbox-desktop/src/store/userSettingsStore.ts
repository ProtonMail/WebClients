import Store from "electron-store";

import type { ESUserChoice } from "@proton/shared/lib/desktop/desktopTypes";

type UserSettings = {
    esUserChoice?: ESUserChoice;
};

const defaultUserSettings: UserSettings = {
    esUserChoice: null,
};

type UserSettingsStore = { [userID: string]: UserSettings };
const USER_SETTINGS = "userSettings";

const store = new Store<{ userSettings?: UserSettingsStore }>({});

const getUserSettings = (userID: string): UserSettings | null => {
    const storedSettings = store.get(USER_SETTINGS);

    if (!storedSettings || !storedSettings[userID]) {
        return null;
    }

    return storedSettings[userID];
};

const changeStoredUserSettings = (userID: string, applyChange: (current: UserSettings) => UserSettings) => {
    const storedUserSettings = store.get(USER_SETTINGS) ?? ({} as UserSettingsStore);
    storedUserSettings[userID] = applyChange(storedUserSettings[userID] ?? defaultUserSettings);
    store.set(USER_SETTINGS, storedUserSettings);
};

export const getESUserChoice = (userID: string): ESUserChoice => {
    const userSettings = getUserSettings(userID);

    if (userSettings === null || userSettings.esUserChoice === undefined) {
        return null;
    }

    return userSettings.esUserChoice;
};

export const setESUserChoice = (userID: string, esUserChoice: boolean) => {
    changeStoredUserSettings(userID, (current) => ({
        ...current,
        esUserChoice,
    }));
};

export const clearUserSettings = (userID: string) => {
    const storedSettings = store.get(USER_SETTINGS);

    if (!storedSettings || !storedSettings[userID]) {
        return;
    }

    delete storedSettings[userID];
    store.set(USER_SETTINGS, storedSettings);
};

export const clearAllUserSettings = () => {
    store.delete(USER_SETTINGS);
};
