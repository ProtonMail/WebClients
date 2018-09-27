import _ from 'lodash';

import { normalizeEmail } from '../../../helpers/string';
import { ADVANCED_SENDING_KEYS, FIELDS } from '../../../helpers/vCardFields';
import { cleanValue } from '../../../helpers/vcard';
import { CONTACT_SETTINGS_DEFAULT } from '../../constants';

const FIELDS_MAP = {
    'x-pm-encrypt': 'Encrypt',
    'x-pm-scheme': 'Scheme',
    'x-pm-mimetype': 'MIMEType',
    'x-pm-sign': 'Sign'
};

/* @ngInject */
function contactEncryptionModel(mailSettingsModel, vcard) {
    const vcardService = vcard;

    /**
     * Returns the default values of the encryption model
     * @return {Object}
     */
    const getDefaultValues = () => {
        return {
            Keys: [],
            Sign: mailSettingsModel.get('Sign') === 1,
            Encrypt: false,
            MIMEType: CONTACT_SETTINGS_DEFAULT,
            Scheme: CONTACT_SETTINGS_DEFAULT
        };
    };
    /**
     * Helper to build the model injected inside contactEncryptionModal
     * @param {Array} properties
     * @return {Object} model { Encrypt: true, Sign: false, Keys: [], ... }
     */
    const buildModel = (properties = []) => {
        // Use reduceRight() to use the first property of each field
        return properties.reduceRight((acc, property) => {
            const field = property.getField();
            const value = property.valueOf();

            if (field === 'key') {
                // We do unshift() to keep the pref order
                acc.Keys.unshift(cleanValue(value));
                return acc;
            }

            const key = FIELDS_MAP[field];
            acc[key] = cleanValue(value, field);

            return acc;
        }, getDefaultValues());
    };
    /**
     * Prepare data to be injected inside contactEncryptionModal
     * @param {vCard} vcard
     * @param {String} normalizedEmail
     * @return {Object} model
     */
    const prepare = (vcard, normalizedEmail) => {
        const emails = vcardService.extractProperties(vcard, FIELDS.EMAIL);
        const emailProperty = emails.find((property) => normalizeEmail(property.valueOf()) === normalizedEmail);

        if (emailProperty) {
            const group = emailProperty.getGroup();
            const properties = vcardService.extractProperties(vcard, ADVANCED_SENDING_KEYS, { group });
            return buildModel(properties);
        }

        // When we create a contact we don't have the email yet but we can have encryption settings
        const hasEncryptionSettings = Object.keys(vcard.data).length && !emailProperty;
        if (hasEncryptionSettings) {
            return buildModel(_.values(vcard.data));
        }

        return buildModel();
    };

    const getMap = () => FIELDS_MAP;

    return { prepare, getMap, getDefaultValues };
}
export default contactEncryptionModel;
