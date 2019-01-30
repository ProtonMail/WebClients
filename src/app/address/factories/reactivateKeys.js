import { encryptPrivateKey, decryptPrivateKey } from 'pmcrypto';

import { MAIN_KEY } from '../../constants';

/* @ngInject */
function reactivateKeys(
    addressesModel,
    addressKeysViewModel,
    authentication,
    Key,
    keysModel,
    eventManager,
    gettextCatalog,
    passwords
) {
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

    /**
     * Reactivate a key by decrypting with the old password, re-encrypting with the new password
     * and uploading it. Catches all failures.
     * @returns {Promise}
     */
    const reactivateKey = async ({ addressID, salt, key, password, oldPassword }) => {
        try {
            const { ID: keyID, PrivateKey } = key;
            const keyPassword = await passwords.computeKeyPassword(oldPassword, salt);
            const decryptedKey = await decryptPrivateKey(PrivateKey, keyPassword);
            const [privateKey, SignedKeyList] = await Promise.all([
                encryptPrivateKey(decryptedKey, password),
                keysModel.signedKeyList(addressID, {
                    mode: 'create',
                    keyID,
                    privateKey: decryptedKey
                })
            ]);
            const data =
                (await Key.reactivate(keyID, {
                    PrivateKey: privateKey,
                    SignedKeyList
                })) || {};

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

    /**
     * Reactivate the requested keys with the password
     * @param {Array} addressesWithKeys
     * @param {String} oldPassword
     * @return {Promise}
     */
    const process = async (addressesWithKeys = [], oldPassword) => {
        const { KeySalts = [] } = await Key.salts();
        const keySalts = KeySalts.reduce((acc, { ID, KeySalt }) => {
            acc[ID] = KeySalt;
            return acc;
        }, {});
        const password = authentication.getPassword();

        // Reactivate all the keys.
        const toActivate = addressesWithKeys.reduce((acc, { addressID, keys }) => {
            const keyArguments = keys.map((key) => {
                return {
                    addressID,
                    salt: keySalts[key.ID],
                    key,
                    password,
                    oldPassword
                };
            });

            return acc.concat(keyArguments);
        }, []);

        const result = [];

        for (let i = 0; i < toActivate.length; ++i) {
            result.push(await reactivateKey(toActivate[i]));
            await eventManager.call();
        }

        // Summarize the results and get the texts to return.
        const summary = getSummary(result);
        return {
            success: getText(I18N.success, summary.success, toActivate),
            failed: getErrorText(summary.failed)
        };
    };

    /**
     * Returns non-decrypted keys for all addresses.
     * E.g. [{ addressID: '0', keys: [list of non-decrypted keys]}]
     * @return {Promise<Array>}
     */
    const get = async () => {
        const { Keys: userKeys = [] } = authentication.user;
        const addresses = addressesModel.get();
        const addressKeysView = await addressKeysViewModel.getAddressKeys(addresses);
        const userAddressWithKeys = {
            addressID: MAIN_KEY,
            keys: userKeys
        };

        const filterDecrypted = ({ decrypted }) => !decrypted;

        return addressKeysView.concat(userAddressWithKeys).reduce((acc, { keys = [], ...rest }) => {
            const nonDecryptedKeys = keys.filter(filterDecrypted);
            if (!nonDecryptedKeys.length) {
                return acc;
            }
            return acc.concat({
                keys: nonDecryptedKeys,
                ...rest
            });
        }, []);
    };

    return { process, get };
}

export default reactivateKeys;
