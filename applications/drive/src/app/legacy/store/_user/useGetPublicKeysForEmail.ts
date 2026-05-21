import { getAllPublicKeys } from '@proton/shared/lib/api/keys';
import type { KEY_FLAG } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { useDebouncedRequest } from '../_api';

type Key = {
    Flags: KEY_FLAG;
    PublicKey: string;
    Source: string;
};

/**
 * Cache to store public keys for emails that were successfully retrieved.
 * This prevents unnecessary API calls when the same email is requested multiple times.
 */
const cacheFoundAddresses = new Map<string, string[]>();

/**
 * Cache to track emails that don't have associated addresses or are from external domains.
 * This helps prevent excessive API calls for deactivated addresses, which could trigger
 * "Too many recent API requests" errors when a user has many files associated with a
 * deactivated address.
 */
const cacheMissingAddresses = new Set<string>();

/**
 * Hook helper to retrieve all public keys for a specific user email.
 * We silence errors for address missing and external domain as we allow addition of exernal users.
 */
export const useGetPublicKeysForEmail = () => {
    const debouncedRequest = useDebouncedRequest();

    const getPublicKeysForEmail = async (
        email: string,
        abortSignal?: AbortSignal,
        /**
         * When true, we won't cache missing addresses. This is important for invitation flows
         * where an external email doesn't exist in the system yet but will be created later
         * when the user accepts the invitation. If we cached these as missing addresses,
         * we would incorrectly assume they're permanently unavailable.
         */
        skipMissingAdressesCache?: boolean
    ) => {
        const cachedFoundaddress = cacheFoundAddresses.get(email);
        if (cachedFoundaddress) {
            return cachedFoundaddress;
        }

        if (!skipMissingAdressesCache) {
            const cachedMissingAddress = cacheMissingAddresses.has(email);
            if (cachedMissingAddress) {
                return undefined;
            }
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
                cacheFoundAddresses.set(email, publicKeys);
                return publicKeys;
            })
            .catch((error) => {
                if (
                    error?.data?.Code === API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING ||
                    error?.data?.Code === API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL
                ) {
                    if (!skipMissingAdressesCache) {
                        // Only cache missing addresses when not in an invitation flow
                        // to prevent "Too many recent API requests" errors
                        cacheMissingAddresses.add(email);
                    }
                    return undefined;
                }
                throw error;
            });
    };

    const getPrimaryPublicKeyForEmail = async (
        email: string,
        abortSignal?: AbortSignal,
        skipMissingAdressesCache?: boolean
    ) => getPublicKeysForEmail(email, abortSignal, skipMissingAdressesCache).then((PublicKeys) => PublicKeys?.[0]);

    return {
        getPrimaryPublicKeyForEmail,
        getPublicKeysForEmail,
    };
};
