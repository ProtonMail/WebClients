import vCard from 'vcf';

import { CONTACT_SETTINGS_DEFAULT } from '../../constants';
import { ADVANCED_SENDING_KEYS } from '../../../helpers/vCardFields';
import { getGroup } from '../../../helpers/vcard';
import { extractAll as extractAllProperties } from '../../../helpers/vCardProperties';
import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function contactEncryptionSaver(
    contactEncryptionModel,
    contactEncryptionAddressMap,
    dispatchers,
    $injector,
    notification,
    gettextCatalog,
    translator
) {

    const I18N = translator(() => ({
        SUCCESS_ADVANCED_SAVED: gettextCatalog.getString('Advanced settings saved', null, 'Info')
    }));

    const { dispatcher } = dispatchers(['contacts']);
    const FIELDS_MAP = contactEncryptionModel.getMap();

    /**
     * Build new vCard with properties set in contactEncryptionModal
     * @param {String} contact.ID
     * @param {vCard} contact.vCard
     * @param {String} normalizedEmail
     * @param {Object} model
     * @return {vCard} newCard
     */
    const build = ({ vCard: card, ID }, normalizedEmail, model) => {
        const allProperties = extractAllProperties(card);
        const emailProperties = allProperties.filter((property) => property.getField() === 'email');
        const group = getGroup(emailProperties, normalizedEmail);
        const properties = allProperties.filter((property) => {
            const field = property.getField();
            const propertyGroup = property.getGroup();

            return propertyGroup !== group || !ADVANCED_SENDING_KEYS.includes(field);
        });

        const models = emailProperties.reduce(
            (acc, property) => {
                const email = normalizeEmail(property.valueOf());

                if (email === normalizedEmail) {
                    return acc;
                }

                acc[email] = {
                    model: contactEncryptionAddressMap.get(ID, email),
                    group: property.getGroup()
                };

                return acc;
            },
            { [normalizedEmail]: { model, group } }
        );

        Object.keys(models).forEach((email) => {
            const { model, group } = models[email];

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
        });

        return properties.reduce((acc, property) => {
            acc.addProperty(property);
            return acc;
        }, new vCard());
    };

    /**
     * Save the contact encryption settings for email at index `index`.
     * @param {Object} model The model that encodes all the current information set
     * @param {String} contact.ID The ID of the contact
     * @param {vCard} contact.vCard The vCard representing this contact
     * @param {String} email
     * @returns {Promise.<void>}
     */
    const save = async (model, { ID, vCard }, email) => {
        const Contact = $injector.get('Contact');
        const newCard = build({ ID, vCard }, email, model);
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
