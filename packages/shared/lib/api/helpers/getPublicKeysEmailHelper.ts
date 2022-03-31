import { CryptoProxy } from '@proton/crypto';
import noop from '@proton/utils/noop';
import { KEY_FLAG, MIME_TYPES, RECIPIENT_TYPES } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { Api, ApiKeysConfig, ProcessedApiKey, SignedKeyListEpochs } from '../../interfaces';
import { getPublicKeys } from '../keys';

const { KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID } = API_CUSTOM_ERROR_CODES;
const EMAIL_ERRORS = [KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID];

/**
 * Ask the API for public keys for a given email address. The response will contain keys both
 * for internal users and for external users with WKD keys
 */
const getPublicKeysEmailHelper = async (
    api: Api,
    Email: string,
    silence = false,
    noCache = false
): Promise<ApiKeysConfig> => {
    try {
        const config: any = { ...getPublicKeys({ Email }), silence };
        if (noCache) {
            config.cache = 'no-cache';
        }
        const { Keys = [], ...rest } = await api<{
            RecipientType: RECIPIENT_TYPES;
            MIMEType: MIME_TYPES;
            Keys: { PublicKey: string; Flags: KEY_FLAG }[];
            SignedKeyList: SignedKeyListEpochs[];
            Warnings: string[];
        }>(config);
        const publicKeys: ProcessedApiKey[] = Keys.map(({ Flags, PublicKey }) => ({
            armoredKey: PublicKey,
            flags: Flags,
        }));
        await Promise.all(
            publicKeys.map(async ({ armoredKey }, index) => {
                try {
                    const key = await CryptoProxy.importPublicKey({ armoredKey });
                    publicKeys[index].publicKey = key;
                } catch {
                    noop();
                }
            })
        );

        return {
            ...rest,
            publicKeys,
        };
    } catch (error: any) {
        const { data = {} } = error;
        if (EMAIL_ERRORS.includes(data.Code)) {
            return { publicKeys: [], Errors: [data.Error] };
        }
        throw error;
    }
};

export default getPublicKeysEmailHelper;
