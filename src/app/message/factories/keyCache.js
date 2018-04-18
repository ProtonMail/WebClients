import _ from 'lodash';
import { RECIPIENT_TYPE, TIME } from '../../constants';

const KEY_GET_ADDRESS_MISSING = 33102;
const KEY_GET_ADDRESS_NO_RECEIVE = 33103;
const TIMEOUT = 10 * TIME.MINUTE;

/* @ngInject */
function keyCache(Key, addressesModel, mailSettingsModel) {
    const CACHE = {};

    /**
     * Tries to get the user keys from the local user. Will return the user keys in the `/keys` format if the email
     * is a local email address. Otherwise it returns null
     * @param email
     * @return Object keys { RecipientType: number, MIMEType: string, Keys: list }
     */
    const getUserAddressesKeys = (email) => {
        const addresses = addressesModel.get();
        const address = addresses.find(({ Email }) => Email === email);
        // Not our address: return undefined
        if (!address) {
            return;
        }
        const { Receive, Keys: addressKeys } = address;

        const keys = addressKeys.map(({ PublicKey, decrypted }) => {
            return {
                Send: decrypted && Receive,
                PublicKey
            };
        });

        // Do not save in the cache: we use the addressesModel cache instead.
        return {
            RecipientType: Receive ? RECIPIENT_TYPE.TYPE_INTERNAL : RECIPIENT_TYPE.TYPE_NO_RECEIVE,
            MIMEType: mailSettingsModel.get('ReceiveMIMEType'),
            Keys: keys
        };
    };

    const getKeysFromApi = (email) => {
        return Key.keys(email)
            .then(({ data }) => {
                CACHE[email] = { time: Date.now(), data: _.pick(data, 'RecipientType', 'MIMEType', 'Keys') };
                return CACHE[email].data;
            })
            .catch((err) => {
                if (err.data && err.data.Code === KEY_GET_ADDRESS_MISSING) {
                    CACHE[email] = {
                        time: Date.now(),
                        data: {
                            RecipientType: RECIPIENT_TYPE.TYPE_NO_RECEIVE,
                            MIMEType: null,
                            Keys: []
                        }
                    };
                    return CACHE[email].data;
                }

                if (err.data && err.data.Code === KEY_GET_ADDRESS_NO_RECEIVE) {
                    CACHE[email] = {
                        time: Date.now(),
                        data: {
                            RecipientType: RECIPIENT_TYPE.TYPE_NO_RECEIVE,
                            MIMEType: null,
                            Keys: []
                        }
                    };
                    return CACHE[email].data;
                }
                throw err;
            });
    };

    const getKeysPerEmail = async (email) => {
        const keys = getUserAddressesKeys(email);
        if (keys) {
            return keys;
        }
        const inCache = _.has(CACHE, email) && CACHE[email].time + TIMEOUT > Date.now();
        if (!inCache) {
            CACHE[email] = { time: Date.now(), data: getKeysFromApi(email) };
        }
        return CACHE[email].data;
    };

    const get = (emails) => {
        return Promise.all(emails.map((email) => getKeysPerEmail(email))).then((keys) => _.zipObject(emails, keys));
    };
    return { get };
}
export default keyCache;
