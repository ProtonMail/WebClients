import { getKeys, OpenPGPKey } from 'pmcrypto';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { noop } from '../../helpers/function';
import { Api, ApiKeysConfig } from '../../interfaces';

import { getPublicKeys } from '../keys';

const { KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID } = API_CUSTOM_ERROR_CODES;
const EMAIL_ERRORS = [KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID];

/**
 * Ask the API for public keys for a given email address. The response will contain keys both
 * for internal users and for external users with WKD keys
 */
const getPublicKeysEmailHelper = async (api: Api, Email: string): Promise<ApiKeysConfig> => {
    try {
        const { Keys = [], ...rest } = await api(getPublicKeys({ Email }));
        const publicKeys = (await Promise.all(
            Keys.map(({ PublicKey }) => {
                return getKeys(PublicKey)
                    .then(([publicKey]) => publicKey)
                    .catch(noop);
            })
        )) as (OpenPGPKey | undefined)[];
        return {
            ...rest,
            Keys,
            publicKeys
        };
    } catch (error) {
        const { data = {} } = error;
        if (EMAIL_ERRORS.includes(data.Code)) {
            return { Keys: [], publicKeys: [] };
        }
        throw error;
    }
};

export default getPublicKeysEmailHelper;
