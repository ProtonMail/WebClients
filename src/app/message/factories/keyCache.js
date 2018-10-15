import _ from 'lodash';
import { RECIPIENT_TYPE, TIME } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';

const { KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID } = API_CUSTOM_ERROR_CODES;

const TIMEOUT = 10 * TIME.MINUTE;

/* @ngInject */
function keyCache(Key, addressesModel, mailSettingsModel) {
    const CACHE = {};
    const EMAIL_ERRORS = [KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID];

    /**
     * Get the keys for an email address from the API.
     * @param {String} email
     * @returns {Promise<{RecipientType, MIMEType, Keys}>}
     */
    const getKeysFromApi = (email) => {
        return Key.keys({ params: { Email: email }, suppress: EMAIL_ERRORS })
            .then((data) => {
                return _.pick(data, 'RecipientType', 'MIMEType', 'Keys');
            })
            .catch((err) => {
                const { data = {} } = err;

                if (EMAIL_ERRORS.includes(data.Code)) {
                    return {
                        RecipientType: RECIPIENT_TYPE.TYPE_NO_RECEIVE,
                        MIMEType: null,
                        Keys: []
                    };
                }

                throw err;
            });
    };

    /**
     * Tries to get the user keys from the local user.
     * Will return the user keys in the `/keys` format if the email is a local email address.
     * Otherwise it returns null
     * @param {Object} address
     * @return {Object} keys { RecipientType: number, MIMEType: string, Keys: list }
     */
    const getUserAddressesKeys = (address) => {
        // Not our address: return undefined
        if (!address) {
            return;
        }

        const { Receive, Keys: addressKeys = [] } = address;
        const Keys = addressKeys.map(({ PublicKey, decrypted }) => {
            return {
                Send: decrypted && Receive,
                PublicKey
            };
        });

        // Do not save in the cache: we use the addressesModel cache instead.
        return {
            RecipientType: Receive ? RECIPIENT_TYPE.TYPE_INTERNAL : RECIPIENT_TYPE.TYPE_NO_RECEIVE,
            MIMEType: mailSettingsModel.get('ReceiveMIMEType'),
            Keys
        };
    };

    /**
     * Get keys for an email address.
     * Either use the cached data, cached http request, or make a new http request.
     * @param {String} email
     * @returns {Promise<{RecipientType, MIMEType, Keys}>}
     */
    const getKeysPerEmail = async (email) => {
        const address = addressesModel.getByEmail(email) || {};
        const keys = getUserAddressesKeys(address);

        if (address.Receive && keys) {
            return keys;
        }

        const { data: cachedData, time: cachedTime = 0, promise: cachedPromise } = CACHE[email] || {};

        if (cachedData && cachedTime + TIMEOUT > Date.now()) {
            return cachedData;
        }

        // If a cached promise exist, wait for it to finish.
        if (cachedPromise) {
            return cachedPromise;
        }

        // Call the API to get the keys.
        const promise = getKeysFromApi(email);

        // Ensure this promise is cached.
        CACHE[email] = {
            promise
        };

        try {
            const data = await promise;
            // If it succeeds, set the cached data.
            CACHE[email] = {
                time: Date.now(),
                data
            };
            return data;
        } catch (e) {
            // Otherwise clear the cache.
            delete CACHE[email];
            throw e;
        }
    };

    /**
     * Get all keys for all emails.
     * @param {Array} emails
     * @returns {Promise<[any]>}
     */
    const get = (emails = []) => {
        return Promise.all(emails.map((email) => getKeysPerEmail(email))).then((keys) => _.zipObject(emails, keys));
    };

    /**
     * Check if an email address is invalid.
     * @param {String} email
     * @returns {Promise<boolean>}
     */
    const isInvalid = async (email = '') => {
        const result = await getKeysPerEmail(email);
        return result.RecipientType === RECIPIENT_TYPE.TYPE_NO_RECEIVE;
    };

    /**
     * Clears the cache
     */
    const clearCache = () => {
        Object.keys(CACHE).forEach((email) => {
            delete CACHE[email];
        });
    };

    return { get, getKeysPerEmail, isInvalid, getUserAddressesKeys, clearCache };
}

export default keyCache;
