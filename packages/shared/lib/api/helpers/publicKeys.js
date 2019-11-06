import { getKeys } from 'pmcrypto';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { getPublicKeys } from '../keys';
import { noop } from '../../helpers/function';

const { KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID } = API_CUSTOM_ERROR_CODES;
const EMAIL_ERRORS = [KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID];

export const getPublicKeysEmailHelper = async (api, Email) => {
    try {
        const { Keys = [], ...rest } = await api(getPublicKeys({ Email }));
        // eslint-disable-next-line no-unused-vars
        const publicKeys = (await Promise.all(
            Keys.map(
                ({ PublicKey }) =>
                    getKeys(PublicKey)
                        .then(([publicKey]) => publicKey)
                        .catch(noop)
                // eslint-disable-next-line
            )
        )).filter(Boolean);
        return {
            ...rest,
            Keys,
            publicKeys
        };
    } catch (error) {
        const { data = {} } = error;
        if (EMAIL_ERRORS.includes(data.Code)) {
            return { Keys: [] };
        }
        throw error;
    }
};
