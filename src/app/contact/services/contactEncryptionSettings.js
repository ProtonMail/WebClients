import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function contactEncryptionSettings(keyCache, contactEncryptionModal, contactEncryptionSaver, networkActivityTracker) {
    /**
     * Get keys and format the model for the modal
     * @param  {String} email
     * @param  {Object} settings Settings (Keys, Scheme, Sign...)
     * @return {Object}
     */
    const loadConfig = async (email, settings = {}) => {
        const keys = await keyCache.getKeysPerEmail(email);
        const { Email: { value: oldEmail = '' } = {} } = settings;
        const isDiff = !oldEmail || normalizeEmail(email) !== normalizeEmail(oldEmail);
        const model = { ...(!isDiff && settings) };
        delete model.Email;
        return { keys, model };
    };

    /**
     * Load Contact encryption settings modal for an email
     *      ⚠ Once done we mutate item to update settings. ⚠
     * @param  {Object} item             Item from a vcard for an Email
     * @param  {Object} options.config   item.settings or an export of the config from the model
     * @param  {Object} options.contact  The contact
     * @param  {Number} index            Position of the item inside the list
     * @param  {Object} form             Form
     * @return {Promise}                 return the new model with { Keys, Sign etc.}
     */
    const get = async (item, { config, contact, index = 0, form }) => {
        const { value: email, settings } = item;
        const { model, keys: internalKeys } = await networkActivityTracker.track(loadConfig(email, settings));

        return new Promise((resolve, reject) => {
            const directSave = !!contact.ID;
            contactEncryptionModal.activate({
                params: {
                    internalKeys,
                    form,
                    email,
                    model,
                    contact,
                    directSave,
                    save(model) {
                        model.Email = { ...item, settings: undefined };
                        item.settings = model;

                        // Update settings from the modal
                        const Emails = config.Emails.map((item) => {
                            if (item.value === model.Email.value) {
                                return { ...item, settings: model };
                            }
                            return item;
                        });

                        if (directSave) {
                            const promise = contactEncryptionSaver.save(
                                {
                                    ...config,
                                    Emails
                                },
                                contact.ID,
                                index
                            );
                            networkActivityTracker.track(promise);
                        }
                        resolve(model);
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
