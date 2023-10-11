import { api } from '@proton/pass/lib/api/api';
import type { PublicKeysResponse } from '@proton/pass/types';
import { getPublicKeys } from '@proton/shared/lib/api/keys';

export const getPublicKeysForEmail = async (email: string): Promise<string[]> => {
    const publicKeys = await api<PublicKeysResponse>(getPublicKeys({ Email: email }));
    return publicKeys.Keys.map((key) => key.PublicKey);
};

export const getPrimaryPublicKeyForEmail = async (email: string): Promise<string> => {
    const publicKeys = await getPublicKeysForEmail(email);
    return publicKeys[0];
};
