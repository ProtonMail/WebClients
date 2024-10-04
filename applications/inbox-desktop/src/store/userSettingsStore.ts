import Store from "electron-store";

import type { ESUserChoice } from "@proton/shared/lib/desktop/desktopTypes";

type UserSettings = {
    esUserChoice: ESUserChoice;
};

const defaultUserSettings: UserSettings = {
    esUserChoice: null,
};

type UserSettingsStore = Map<string, UserSettings>;

const store = new Store<{ userSettings: UserSettingsStore }>();

const getUserSettings = (userID: string): UserSettings | null => store.get("userSettings").get(userID) ?? null;

function changeStoredUserSettings(userID: string, applyChange: (current: UserSettings) => UserSettings) {
    const storedUserSettings = store.get("userSettings");

    storedUserSettings.set(userID, applyChange(storedUserSettings.get(userID) ?? defaultUserSettings));

    store.set(userID, storedUserSettings);
}

export function getESUserChoice(userID: string): ESUserChoice {
    const userSettings = getUserSettings(userID);

    if (userSettings == null) {
        return null;
    }

    return userSettings.esUserChoice;
}

export function setESUserChoice(userID: string, esUserChoice: boolean) {
    changeStoredUserSettings(userID, (current) => ({
        ...current,
        esUserChoice,
    }));
}
