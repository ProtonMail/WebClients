import { getGroup } from '../../../helpers/vcard';
import { CONTACT_SETTINGS_DEFAULT } from '../../constants';
import { ADVANCED_SENDING_KEYS } from '../../../helpers/vCardFields';

/* @ngInject */
function contactEncryptionSaver(contactEncryptionModel, dispatchers, vcard, $injector, notification, gettextCatalog) {
    const I18N = {
        SUCCESS_ADVANCED_SAVED: gettextCatalog.getString('Advanced settings saved', null, 'Info')
    };
    const vcardService = vcard;
    const { dispatcher } = dispatchers(['contacts']);
    const FIELDS_MAP = contactEncryptionModel.getMap();

    /**
     * Build new vCard with properties set in contactEncryptionModal
     * @param {vCard} vcard
     * @param {String} normalizedEmail
     * @param {Object} model
     * @return {vCard} newCard
     */
    const build = (vcard, normalizedEmail, model) => {
        const allProperties = vcardService.extractAllProperties(vcard);
        const emailProperties = allProperties.filter((property) => property.getField() === 'email');
        const group = getGroup(emailProperties, normalizedEmail);
        const properties = allProperties.filter((property) => {
            const field = property.getField();
            const propertyGroup = property.getGroup();

            return propertyGroup !== group || !ADVANCED_SENDING_KEYS.includes(field);
        });

        ADVANCED_SENDING_KEYS.forEach((field) => {
            if (field === 'key') {
                model.Keys.forEach((value, index) => {
                    properties.push(new vCard.Property(field, String(value), { group, pref: index + 1 }));
                });
            }

            const value = model[FIELDS_MAP[field]];

            if (typeof value !== 'undefined' && value !== CONTACT_SETTINGS_DEFAULT) {
                properties.push(new vCard.Property(field, String(value), { group }));
            }
        });

        return properties.reduce((acc, property) => {
            acc.addProperty(property);
            return acc;
        }, new vCard());
    };

    /**
     * Save the contact encryption settings for email at index `index`.
     * @param {Object} model The model that encodes all the current information set
     * @param {String} ID The ID of the contact
     * @param {vCard} card The vCard representing this contact
     * @param {String} email
     * @returns {Promise.<void>}
     */
    const save = async (model, { ID, vCard }, email) => {
        const Contact = $injector.get('Contact');
        const newCard = build(vCard, email, model);
        const { Contact: data, cards } = await Contact.updateUnencrypted({
            ID,
            vCard: newCard
        });

        dispatcher.contacts('contactUpdated', { contact: data, cards });
        notification.success(I18N.SUCCESS_ADVANCED_SAVED);
    };

    return { save, build };
}
export default contactEncryptionSaver;
