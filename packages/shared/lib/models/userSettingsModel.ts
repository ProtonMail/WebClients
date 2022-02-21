import { getSettings } from '../api/settings';
import updateObject from '../helpers/updateObject';
import { Api, UserSettings } from '../interfaces';

export const getUserSettingsModel = (api: Api) => {
    return api<{ UserSettings: UserSettings }>(getSettings()).then(({ UserSettings }) => {
        const userSettings: UserSettings = UserSettings;
        return userSettings;
    });
};

export const UserSettingsModel = {
    key: 'UserSettings',
    get: getUserSettingsModel,
    update: updateObject,
};
