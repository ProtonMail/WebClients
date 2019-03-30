import { getMailSettings } from '../api/mailSettings';
import updateObject from '../helpers/updateObject';

export const getMailSettingsModel = (api) => {
    return api(getMailSettings()).then(({ MailSettings }) => MailSettings);
};

export const handleMailSettingsEvents = updateObject;

export const MailSettingsModel = {
    key: 'MailSettings',
    get: getMailSettingsModel,
    update: updateObject
};
