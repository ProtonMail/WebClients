import { useCallback } from 'react';
import { decryptPrivateKey } from 'pmcrypto';
import { noop } from 'proton-shared/lib/helpers/function';
import { Key as tsKey, CachedKey } from 'proton-shared/lib/interfaces';
import { decryptMemberToken } from 'proton-shared/lib/keys/memberToken';
import useAuthentication from '../containers/authentication/useAuthentication';
import { useGetUser } from './useUser';

export const useGetUserKeysRaw = (): (() => Promise<CachedKey[]>) => {
    const authentication = useAuthentication();
    const getUser = useGetUser();

    return useCallback(async () => {
        const { OrganizationPrivateKey, Keys = [] } = await getUser();

        if (Keys.length === 0) {
            return [];
        }

        const mailboxPassword = authentication.getPassword();

        const organizationKey = OrganizationPrivateKey
            ? await decryptPrivateKey(OrganizationPrivateKey, mailboxPassword).catch(noop)
            : undefined;

        const process = async (Key: tsKey) => {
            try {
                const { PrivateKey, Token } = Key;
                const keyPassword =
                    Token && organizationKey ? await decryptMemberToken(Token, organizationKey) : mailboxPassword;
                const privateKey = await decryptPrivateKey(PrivateKey, keyPassword);
                return {
                    Key,
                    privateKey,
                    publicKey: privateKey.toPublic()
                };
            } catch (e) {
                return {
                    Key,
                    error: e
                };
            }
        };

        const [primaryKey, ...restKeys] = Keys;
        const primaryKeyResult = await process(primaryKey);

        // In case the primary key fails to decrypt, something is broken, so don't even try to decrypt the rest of the keys.
        if (primaryKeyResult.error) {
            return [primaryKeyResult, ...restKeys.map((Key) => ({ Key, error: primaryKeyResult.error }))];
        }
        const restKeysResult = await Promise.all(restKeys.map(process));
        return [primaryKeyResult, ...restKeysResult];
    }, [getUser]);
};
