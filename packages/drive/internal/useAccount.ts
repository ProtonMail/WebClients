import { useRef } from 'react';

import type { ProtonDriveAccount, ProtonDriveAccountAddress } from '@protontech/drive-sdk';
import type { PublicKey } from '@protontech/drive-sdk/dist/crypto';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import type { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
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

    const cachedPublicKeys = useRef(new Map<string, PublicKeyReference[]>());

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

    const getPublicKeys = async (email: string): Promise<PublicKey[]> => {
        if (!authentication.getUID()) {
            return [];
        }

        // If the address is own address, use the keys from that directly
        // as that is already imported in the cache.
        // Except if the address is disabled, in which case we need to provide
        // both the disabled keys and request the public keys. It is crucial
        // for the following two use cases:
        // 1. If user uploaded the file previously and now the address is
        //    disabled, we still need to provide the disabled keys to verify
        //    the signature.
        // 2. If user disabled custom domain address and recreated it for
        //    different user, we still need to provide the public keys of the
        //    other user to encrypt invitation to the original user.
        // Thus we need to provide both. The disabled address keys are ordered
        // at the end of the array to have lower priority (so the second case
        // works), but still present (so the first case works).
        let disabledKeys: PublicKey[] = [];
        try {
            const address = await getOwnAddress(email);
            const keys = address.keys.map(({ key }) => key);
            if (!address.isDisabled) {
                return keys;
            } else {
                disabledKeys = keys;
            }
        } catch {}

        const cachedKeys = cachedPublicKeys.current.get(email);
        if (cachedKeys !== undefined) {
            return [...cachedKeys, ...disabledKeys];
        }

        const response = await api<{
            Address: { Keys: { PublicKey: string }[] };
            Unverified?: { Keys: { PublicKey: string }[] };
        }>({
            ...getAllPublicKeys({
                Email: email,
                InternalOnly: 1,
            }),
            silence: [API_CUSTOM_ERROR_CODES.KEY_GET_ADDRESS_MISSING, API_CUSTOM_ERROR_CODES.KEY_GET_DOMAIN_EXTERNAL],
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
        const publicKeys = await Promise.all(
            keys.map((key) => CryptoProxy.importPublicKey({ armoredKey: key.PublicKey }))
        );

        cachedPublicKeys.current.set(email, publicKeys);

        return [...publicKeys, ...disabledKeys];
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
