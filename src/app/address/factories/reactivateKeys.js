import _ from 'lodash';

/* @ngInject */
function reactivateKeys(authentication, Key, eventManager, gettextCatalog, passwords, pmcw) {
    const FAILED_DECRYPTION_PASSWORD = 1;
    const FAILED_KEY_REACTIVATE = 2;

    const I18N = {
        success: {
            one: gettextCatalog.getString('Key reactivated', null, 'Info'),
            many: (n) => gettextCatalog.getString('{{n}} keys reactivated', { n }, 'Info')
        },
        errors: {
            [FAILED_DECRYPTION_PASSWORD]: {
                one: gettextCatalog.getString('Incorrect decryption password', null, 'Error'),
                many: (n) =>
                    gettextCatalog.getString(
                        '{{n}} keys failed to decrypt due to an incorrect password',
                        { n },
                        'Error'
                    )
            },
            [FAILED_KEY_REACTIVATE]: {
                one: gettextCatalog.getString('Failed to reactivate key', null, 'Error'),
                many: (n) => gettextCatalog.getString('{{n}} keys failed to reactivate', { n }, 'Error')
            }
        }
    };

    /**
     * Get the text from based on the results.
     * @param {Object} text in the i18n
     * @param {Array} array
     * @param {Array} total
     * @returns {String} translated text
     */
    const getText = (text, array = [], total = []) => {
        if (array.length === 0) {
            return;
        }
        if (array.length === total.length && total.length === 1) {
            return text.one;
        }
        return text.many(array.length);
    };

    /**
     * Get the error texts for the errors.
     * @param {Array} errors
     * @returns {string} text with error(s), joined by a ,
     */
    const getErrorText = (errors = []) => {
        return [FAILED_DECRYPTION_PASSWORD, FAILED_KEY_REACTIVATE]
            .map((err) => {
                const total = errors.filter(({ error }) => error === err);
                return getText(I18N.errors[err], total, total);
            })
            .filter(Boolean)
            .join(', ');
    };

    /**
     * Summarize the result of the reactivation promises.
     * @param {Array} result
     * @returns {{success: Array, failed: Array}}
     */
    const getSummary = (result = []) => {
        return result.reduce(
            (acc, result = {}) => {
                if (result.error) {
                    acc.failed.push(result);
                } else {
                    acc.success.push(result);
                }
                return acc;
            },
            { success: [], failed: [] }
        );
    };

    return async (keys = [], oldPassword) => {
        const { data = {} } = await Key.salts();
        const salts = _.reduce(
            keys,
            (acc, key) => {
                const { KeySalt } = _.find(data.KeySalts, { ID: key.ID }) || {};

                // KeySalt can be an empty string
                acc.push({ KeySalt, key });

                return acc;
            },
            []
        );
        const password = authentication.getPassword();

        /**
         * Reactivate a key by decrypting with the old password, re-encrypting with the new password
         * and uploading it. Catches all failures.
         * @returns {Promise}
         */
        const reactivateKey = async ({ KeySalt, key }) => {
            try {
                const keyPassword = await passwords.computeKeyPassword(oldPassword, KeySalt);
                const decryptedKey = await pmcw.decryptPrivateKey(key.PrivateKey, keyPassword);
                const privateKey = await pmcw.encryptPrivateKey(decryptedKey, password);

                // Update the key in the API.
                const data = (await Key.reactivate(key.ID, { PrivateKey: privateKey })) || {};

                key.decrypted = true;

                return data;
            } catch (e) {
                if (e instanceof Error) {
                    return {
                        error: FAILED_DECRYPTION_PASSWORD,
                        key
                    };
                }
                return {
                    error: FAILED_KEY_REACTIVATE,
                    key
                };
            }
        };

        // Reactivate all the keys.
        const promises = salts.map(reactivateKey);
        const result = await Promise.all(promises);

        // Finished, call the event manager.
        eventManager.call();

        // Summarize the results and get the texts to return.
        const summary = getSummary(result);
        return {
            success: getText(I18N.success, summary.success, promises),
            failed: getErrorText(summary.failed)
        };
    };
}

export default reactivateKeys;
