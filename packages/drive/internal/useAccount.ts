import { useRef } from 'react';

import { CryptoProxy } from '@protontech/crypto';
import type { ProtonDriveAccount, ProtonDriveAccountAddress } from '@protontech/drive-sdk';
import type { PublicKey } from '@protontech/drive-sdk/dist/crypto';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useApi } from '@proton/app-context/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { getAllPublicKeys } from '@proton/shared/lib/api/keys';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';

export function useAccount(): ProtonDriveAccount {
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    // This is using AuthenticationProvider, it should be included in every app already
    // TODO: Check if we can improve that, probably we can pass authentication through the init of drive and then instanciate it here
    const authentication = useAuthentication();
    const getPublicKeysPromises = useRef(new Map<string, Promise<PublicKey[]>>());

    const getOwnPrimaryAddress = async (): Promise<ProtonDriveAccountAddress> => {
        const addresses = await getAddresses();
        const primaryAddress = addresses[0];
        if (!primaryAddress) {
            throw new Error('No primary address found');
        }

        const keys = await getAddressKeys(primaryAddress.ID);

        return {
            email: primaryAddress.Email,
            addressId: primaryAddress.ID,
            primaryKeyIndex: 0,
            keys: keys.map((key) => ({
                id: key.ID,
                key: key.privateKey,
            })),
        };
    };

    const getOwnAddress = async (
        emailOrAddressId: string
    ): Promise<ProtonDriveAccountAddress & { isDisabled: boolean }> => {
        const addresses = await getAddresses();
        const address = addresses.find(
            (addr) =>
                canonicalizeInternalEmail(addr.Email) === canonicalizeInternalEmail(emailOrAddressId) ||
                addr.ID === emailOrAddressId
        );
        if (!address) {
            throw new Error('No address found');
        }

        const keys = await getAddressKeys(address.ID);

        return {
            email: address.Email,
            addressId: address.ID,
            primaryKeyIndex: 0,
            isDisabled: address.Status !== ADDRESS_STATUS.STATUS_ENABLED,
            keys: keys.map((key) => ({
                id: key.ID,
                key: key.privateKey,
            })),
        };
    };

    const getOwnAddresses = async (): Promise<ProtonDriveAccountAddress[]> => {
        const addresses = await getAddresses();

        const ownAddresses = [];
        for (const address of addresses) {
            ownAddresses.push(await getOwnAddress(address.ID));
        }
        return ownAddresses;
    };

    const getPublicKeys = async (email: string, forceRefresh?: boolean): Promise<PublicKey[]> => {
        if (!authentication.getUID()) {
            return [];
        }

        // If the address is disabled we still need both its keys and the
        // API public keys:
        // 1. To verify signatures from files uploaded before the address was
        //    disabled.
        // 2. To encrypt invitations to a new user who claimed the same domain
        //    address. Disabled keys go last to give them lower priority.
        let disabledOwnKeys: PublicKey[] = [];
        try {
            // Own address keys are always fetched fresh - never cached here.
            // The account layer caches getAddressKeys internally, so this is
            // not expensive. Caching them here caused stale-reference bugs when
            // the account layer invalidated its key cache while the page was open.
            const address = await getOwnAddress(email);
            const keys = address.keys.map(({ key }) => key);
            if (!address.isDisabled) {
                return keys;
            }
            disabledOwnKeys = keys;
        } catch {}

        // For external addresses and disabled own addresses, cache only the
        // API-fetched public keys. Those are imported into CryptoProxy and
        // are never removed from there, so the cached references stay valid.
        const existing = getPublicKeysPromises.current.get(email);
        if (!forceRefresh && existing) {
            const publicKeys = await existing;
            return [...publicKeys, ...disabledOwnKeys];
        }

        const promise = (async (): Promise<PublicKey[]> => {
            const response = await api<{
                Address: { Keys: { PublicKey: string }[] };
                Unverified?: { Keys: { PublicKey: string }[] };
            }>({
                ...getAllPublicKeys({
                    Email: email,
                    InternalOnly: 1,
                }),
                silence: [
                    API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING,
                    API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL,
                ],
            }).catch((e) => {
                // We should not failed on missing address
                if (
                    e?.data?.Code === API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING ||
                    e?.data?.Code === API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL
                ) {
                    return { Address: { Keys: [] }, Unverified: undefined };
                }
                throw e;
            });

            const keys =
                response.Address.Keys.length === 0 && response.Unverified
                    ? response.Unverified.Keys
                    : response.Address.Keys;
            return Promise.all(keys.map((key) => CryptoProxy.importPublicKey({ armoredKey: key.PublicKey })));
        })();

        getPublicKeysPromises.current.set(email, promise);
        promise.catch(() => getPublicKeysPromises.current.delete(email));

        const publicKeys = await promise;
        return [...publicKeys, ...disabledOwnKeys];
    };

    const hasProtonAccount = async (email: string): Promise<boolean> => {
        try {
            const keys = await getPublicKeys(email);
            return keys.length > 0;
        } catch {
            return false;
        }
    };

    // Ensure the reference is stable across renders. Never update the whole object.
    const account = useRef<ProtonDriveAccount>({
        getOwnPrimaryAddress,
        getOwnAddress,
        getOwnAddresses,
        hasProtonAccount,
        getPublicKeys,
    });

    account.current.getOwnPrimaryAddress = getOwnPrimaryAddress;
    account.current.getOwnAddress = getOwnAddress;
    account.current.getOwnAddresses = getOwnAddresses;
    account.current.hasProtonAccount = hasProtonAccount;
    account.current.getPublicKeys = getPublicKeys;

    return account.current;
}
