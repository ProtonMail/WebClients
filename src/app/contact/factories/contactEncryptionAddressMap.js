import { FIELDS, ADVANCED_SENDING_KEYS } from '../../../helpers/vCardFields';
import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function contactEncryptionAddressMap(dispatchers, vcard, contactEncryptionModel) {
    const { on } = dispatchers();

    const CACHE = { models: {} };
    /**
     * Set a certain contactencryption model on an address that is located in the contact associated with the given contact
     * id. The contact's data should be initialized using init before calling this function.
     * @param {String} id The contact id
     * @param {String} address The email address that the contact should be associated with
     * @param {Object} model The model that has to be set
     */
    const set = (id, address, model) => {
        CACHE.models[id][normalizeEmail(address)] = model;
    };

    /**
     * Get a certain contactencryption model on an address that is located in the contact associated with the given
     * contact id.  The contact's data should be initialized using init before calling this function.
     * @param {String} id The contact id from which to fetch the data
     * @param {String} address The email address that the contact should be associated with
     * @return {Object}
     */
    const get = (id, address) => {
        const normAddress = normalizeEmail(address);
        if (!CACHE.models[id][normAddress]) {
            CACHE.models[id][normAddress] = contactEncryptionModel.getDefaultValues();
        }
        return CACHE.models[id][normAddress];
    };

    /**
     * Extracts the contactencryption information from the card into the map.
     * @param {String} id The contact id from which to fetch the data.
     * @param {vCard} card The vCard from which to fetch the appropriate data.
     */
    const init = (id, card) => {
        CACHE.models[id] = {};
        const emails = vcard.extractProperties(card, FIELDS.EMAIL);
        emails.forEach((property) => {
            const normalizedEmail = normalizeEmail(property.valueOf());
            set(id, normalizedEmail, contactEncryptionModel.prepare(card, normalizedEmail));
        });
        ADVANCED_SENDING_KEYS.forEach((prop) => card.remove(prop));
    };

    on('logout', () => {
        CACHE.models = {};
    });

    return { init, set, get };
}
export default contactEncryptionAddressMap;
