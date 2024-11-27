import { getAllPublicKeys } from '@proton/shared/lib/api/keys';
import type { KEY_FLAG } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { useDebouncedRequest } from '../_api';

type Key = {
    Flags: KEY_FLAG;
    PublicKey: string;
    Source: string;
};

const cache = new Map<string, string[]>();

/**
 * Hook helper to retrieve all public keys for a specific user email.
 * We silence errors for address missing and external domain as we allow addition of exernal users.
 */
export const useGetPublicKeysForEmail = () => {
    const debouncedRequest = useDebouncedRequest();

    const getPublicKeysForEmail = async (email: string, abortSignal?: AbortSignal) => {
        const cached = cache.get(email);
        if (cached) {
            return cached;
        }
        return debouncedRequest<{ Address: { Keys: Key[] }; Unverified?: { Keys: Key[] } }>(
            {
                ...getAllPublicKeys({
                    Email: email,
                    InternalOnly: 1,
                }),
                silence: [
                    API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING,
                    API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL,
                ],
            },
            abortSignal
        )
            .then(({ Address, Unverified }) => {
                const publicKeys = (Address.Keys.length === 0 && Unverified ? Unverified.Keys : Address.Keys).map(
                    (key) => key.PublicKey
                );
                cache.set(email, publicKeys);
                return publicKeys;
            })
            .catch((error) => {
                if (
                    error?.data?.Code === API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING ||
                    error?.data?.Code === API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL
                ) {
                    return undefined;
                }
                throw error;
            });
    };

    const getPrimaryPublicKeyForEmail = async (email: string, abortSignal?: AbortSignal) =>
        getPublicKeysForEmail(email, abortSignal).then((PublicKeys) => PublicKeys?.[0]);

    return {
        getPrimaryPublicKeyForEmail,
        getPublicKeysForEmail,
    };
};
