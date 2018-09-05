import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function contactEncryptionSettings(
    keyCache,
    contactEncryptionModal,
    contactEncryptionModel,
    contactEncryptionSaver,
    networkActivityTracker
) {
    /**
     * Get keys and format the model for the modal
     * @param  {String} email
     * @param  {contact} settings Settings (Keys, Scheme, Sign...)
     * @return {Object}
     */
    const loadConfig = async (email, contact) => {
        const keys = await keyCache.getKeysPerEmail(email);
        const model = contactEncryptionModel.prepare(contact.vCard, normalizeEmail(email));
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
        const { model, keys: internalKeys } = await networkActivityTracker.track(loadConfig(email, contact));

        return new Promise((resolve, reject) => {
            const directSave = !!contact.ID;

            const getData = (model) => {
                if (directSave) {
                    const promise = contactEncryptionSaver.save(model, contact.ID, email);
                    networkActivityTracker.track(promise);
                    return { model };
                }
                const vCard = contactEncryptionSaver.build(contact.vCard, email, model);
                return { model, vCard };
            };

            contactEncryptionModal.activate({
                params: {
                    internalKeys,
                    email,
                    model,
                    directSave,
                    save(model) {
                        resolve(getData(model));
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
