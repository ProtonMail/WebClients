import { getKeys } from 'pmcrypto';
import { decryptMemberToken } from 'proton-shared/lib/keys/organizationKeys';
import {
    decryptPrivateKey,
    decryptPrivateKeyArmored,
    decryptAddressKeyToken,
    splitKeys
} from 'proton-shared/lib/keys/keys';
import { usePromiseResult, useAuthentication } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

const getAddressKeyToken = ({ Token, Signature, organizationKey, privateKeys, publicKeys }) => {
    // New address key format
    if (Signature) {
        return decryptAddressKeyToken({
            Token,
            Signature,
            privateKeys,
            // Verify against the organization key in case an admin is signed in to a non-private member.
            publicKeys: organizationKey ? [organizationKey.toPublic()] : publicKeys
        });
    }
    // Old address key format for an admin signed into a non-private user
    return decryptMemberToken(Token, organizationKey);
};

const useAddressesKeys = (user, addresses, userKeysList) => {
    const authentication = useAuthentication();

    return usePromiseResult(async () => {
        if (!Array.isArray(addresses) || !Array.isArray(userKeysList) || userKeysList.length === 0) {
            return;
        }

        const keyPassword = authentication.getPassword();

        // Case for admins logged in to non-private members.
        const { OrganizationPrivateKey } = user;
        const organizationKey = OrganizationPrivateKey
            ? await decryptPrivateKeyArmored(OrganizationPrivateKey, keyPassword).catch(noop)
            : undefined;

        const { privateKeys, publicKeys } = splitKeys(userKeysList);

        const keys = await Promise.all(
            addresses.map(({ Keys }) => {
                return Promise.all(
                    Keys.map(async (Key) => {
                        const { PrivateKey, Token, Signature } = Key;
                        const [privateKey] = await getKeys(PrivateKey).catch(() => []);
                        try {
                            const privateKeyPassword = Token
                                ? await getAddressKeyToken({
                                      Token,
                                      Signature,
                                      organizationKey,
                                      privateKeys,
                                      publicKeys
                                  })
                                : keyPassword;
                            await decryptPrivateKey(privateKey, privateKeyPassword);
                            return { Key, privateKey, publicKey: privateKey.toPublic() };
                        } catch (e) {
                            return { Key, privateKey, publicKey: privateKey.toPublic(), error: e };
                        }
                    })
                );
            })
        );

        return addresses.reduce((acc, { ID }, i) => {
            return {
                ...acc,
                [ID]: keys[i]
            };
        }, {});
    }, [addresses, userKeysList]);
};

export default useAddressesKeys;
