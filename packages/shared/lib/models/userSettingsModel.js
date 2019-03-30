import { getSettings } from '../api/settings';
import updateObject from '../helpers/updateObject';

export const getUserSettingsModel = (api) => {
    return api(getSettings()).then(({ UserSettings }) => UserSettings);
};

export const UserSettingsModel = {
    key: 'UserSettings',
    get: getUserSettingsModel,
    update: updateObject
};
