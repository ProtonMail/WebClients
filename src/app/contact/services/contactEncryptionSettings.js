import { CONTACT_ADD_ID } from '../../constants';

/* @ngInject */
function contactEncryptionSettings(
    keyCache,
    contactEncryptionModal,
    contactEncryptionSaver,
    contactEncryptionAddressMap,
    networkActivityTracker
) {
    /**
     * Get keys and format the model for the modal
     * @param  {String} email
     * @param  {String} id contact id
     * @return {Object}
     */
    const loadConfig = async (email, id) => {
        const keys = await keyCache.getKeysPerEmail(email);
        const model = contactEncryptionAddressMap.get(id, email);
        return { keys, model };
    };

    /**
     * Load Contact encryption settings modal for an email
     *      ⚠ Once done we mutate item to update settings. ⚠
     * @param  {Object} item             Item from a vcard for an Email
     * @param  {Object} contact          The contact
     * @return {Promise}                 return the new model with { Keys, Sign etc.}
     */
    const get = async ({ value: email } = {}, contact) => {
        const directSave = !!contact.ID;
        const contactId = contact.ID || CONTACT_ADD_ID;
        const { model, keys: internalKeys } = await networkActivityTracker.track(loadConfig(email, contactId));

        return new Promise((resolve, reject) => {
            const saveData = async (model) => {
                contactEncryptionAddressMap.set(contactId, email, model);

                if (directSave) {
                    const promise = contactEncryptionSaver.save(model, contact, email);
                    await networkActivityTracker.track(promise);
                }
            };

            contactEncryptionModal.activate({
                params: {
                    internalKeys,
                    email,
                    model,
                    directSave,
                    save(model) {
                        saveData(model);
                        resolve();
                        contactEncryptionModal.deactivate();
                    },
                    close() {
                        reject();
                        contactEncryptionModal.deactivate();
                    }
                }
            });
        });
    };

    return get;
}
export default contactEncryptionSettings;
