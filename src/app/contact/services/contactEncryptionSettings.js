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
     * @param  {Object} item            Item from a vcard for an Email
     * @param  {Object} contact         The contact
     * @param  {String} option.mode     'view' from contact view details
     * @param  {Object} option.form     Contact form used in the contact detail
     * @return {Promise}                return the new model with { Keys, Sign etc.}
     */
    const get = async ({ value: email } = {}, contact, { mode, form }) => {
        const directSave = mode === 'view';
        const contactId = contact.ID || CONTACT_ADD_ID;
        const { model, keys: internalKeys } = await networkActivityTracker.track(loadConfig(email, contactId));

        return new Promise((resolve, reject) => {
            const saveData = async (model) => {
                contactEncryptionAddressMap.set(contactId, email, model);

                if (directSave) {
                    // Save entire contact model only for the contact view details (view mode) because the email is already defined in the model
                    const promise = contactEncryptionSaver.save(model, contact, email);
                    await networkActivityTracker.track(promise);
                } else {
                    form && form.$setDirty();
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
