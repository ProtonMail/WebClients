import { useRef } from 'react';

import type { ProtonDriveAccount, ProtonDriveAccountAddress } from '@protontech/drive-sdk';
import type { PublicKey } from '@protontech/drive-sdk/dist/crypto';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useApi } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { getAllPublicKeys } from '@proton/shared/lib/api/keys';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';

export function useAccount(): ProtonDriveAccount {
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();

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

    const getOwnAddress = async (emailOrAddressId: string): Promise<ProtonDriveAccountAddress> => {
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
            keys: keys.map((key) => ({
                id: key.ID,
                key: key.privateKey,
            })),
        };
    };

    const getPublicKeys = async (email: string): Promise<PublicKey[]> => {
        try {
            const address = await getOwnAddress(email);
            const keys = address.keys.map(({ key }) => key);
            return keys;
        } catch {}

        const cachedKeys = cachedPublicKeys.current.get(email);
        if (cachedKeys !== undefined) {
            return cachedKeys;
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
        });

        const keys =
            response.Address.Keys.length === 0 && response.Unverified
                ? response.Unverified.Keys
                : response.Address.Keys;
        const publicKeys = await Promise.all(
            keys.map((key) => CryptoProxy.importPublicKey({ armoredKey: key.PublicKey }))
        );

        cachedPublicKeys.current.set(email, publicKeys);

        return publicKeys;
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
        hasProtonAccount,
        getPublicKeys,
    });

    account.current.getOwnPrimaryAddress = getOwnPrimaryAddress;
    account.current.getOwnAddress = getOwnAddress;
    account.current.hasProtonAccount = hasProtonAccount;
    account.current.getPublicKeys = getPublicKeys;

    return account.current;
}
