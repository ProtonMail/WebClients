import { usePromiseResult, useAuthentication } from 'react-components';
import { getKeys } from 'pmcrypto';
import { decryptMemberToken } from 'proton-shared/lib/keys/organizationKeys';
import { noop } from 'proton-shared/lib/helpers/function';

import { decryptPrivateKey, decryptPrivateKeyArmored } from 'proton-shared/lib/keys/keys';

const useUserKeys = (User) => {
    const authentication = useAuthentication();

    return usePromiseResult(async () => {
        const { OrganizationPrivateKey, Keys } = User;
        const keyPassword = authentication.getPassword();

        // Case for admins logged in to non-private members.
        const organizationKey = OrganizationPrivateKey
            ? await decryptPrivateKeyArmored(OrganizationPrivateKey, keyPassword).catch(noop)
            : undefined;

        return Promise.all(
            Keys.map(async (Key) => {
                const { PrivateKey, Token } = Key;
                const [privateKey] = await getKeys(PrivateKey).catch(() => []);
                try {
                    const privateKeyPassword = Token ? await decryptMemberToken(Token, organizationKey) : keyPassword;
                    await decryptPrivateKey(privateKey, privateKeyPassword);
                    return { Key, privateKey };
                } catch (e) {
                    return { Key, privateKey, error: e };
                }
            })
        );
    }, [User]);
};

export default useUserKeys;
