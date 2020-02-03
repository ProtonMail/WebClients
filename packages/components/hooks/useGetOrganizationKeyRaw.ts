import { useCallback } from 'react';
import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import { getOrganizationKeys } from 'proton-shared/lib/api/organization';
import { useAuthentication, useApi } from '../index';

export interface OrganizationKey {
    Key: {
        PrivateKey: string;
        PublicKey: string;
    };
    privateKey?: OpenPGPKey;
    error?: Error;
}
export const useGetOrganizationKeyRaw = (): (() => Promise<OrganizationKey>) => {
    const authentication = useAuthentication();
    const api = useApi();

    return useCallback(async () => {
        const Key = await api<{ PublicKey: string; PrivateKey: string }>(getOrganizationKeys());
        if (!Key.PrivateKey) {
            return {
                Key
            };
        }
        try {
            const mailboxPassword = authentication.getPassword();
            const privateKey = await decryptPrivateKey(Key.PrivateKey, mailboxPassword);
            return {
                Key,
                privateKey
            };
        } catch (e) {
            return {
                Key,
                error: e
            };
        }
    }, []);
};

export default useGetOrganizationKeyRaw;
