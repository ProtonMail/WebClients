import { api } from '@proton/pass/lib/api/api';
import type { GetAllPublicKeysResponse, Maybe } from '@proton/pass/types';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAllPublicKeys } from '@proton/shared/lib/api/keys';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

export const getPublicKeysForEmail = async (email: string): Promise<string[]> => {
    const { Address } = await api<GetAllPublicKeysResponse>(getAllPublicKeys({ Email: email, InternalOnly: 1 }));
    return Address.Keys.map((key) => key.PublicKey);
};

export const getPrimaryPublicKeyForEmail = async (email: string): Promise<Maybe<string>> => {
    try {
        const publicKeys = await getPublicKeysForEmail(email);
        return publicKeys?.[0];
    } catch (err) {
        const { code } = getApiError(err);
        if (
            code === API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING ||
            code === API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL
        ) {
            return undefined;
        }
        throw err;
    }
};
