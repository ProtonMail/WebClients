import React, { useEffect } from 'react';
import { encryptPrivateKey } from 'pmcrypto';
import { Address, UserModel as tsUserModel } from 'proton-shared/lib/interfaces';
import getActionableKeysList from 'proton-shared/lib/keys/getActionableKeysList';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';
import { activateKeyRoute } from 'proton-shared/lib/api/keys';
import { traceError } from 'proton-shared/lib/helpers/sentry';
import { noop } from 'proton-shared/lib/helpers/function';
import { MEMBER_PRIVATE } from 'proton-shared/lib/constants';

import { useApi, useAuthentication, useGetAddressKeys } from '../../hooks';

interface Props {
    user?: tsUserModel;
    addresses?: Address[];
}
const ReadableMemberKeyActivation = ({ addresses, user }: Props) => {
    const getAddressKeys = useGetAddressKeys();
    const authentication = useAuthentication();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    useEffect(() => {
        const run = async () => {
            if (!user || !addresses) {
                return;
            }
            // If signed in as subuser, or not a readable member
            if (user.OrganizationPrivateKey || user.Private !== MEMBER_PRIVATE.READABLE) {
                return;
            }
            const addressesWithKeysToActivate = addresses.filter(({ Keys = [] }) => {
                return Keys.some(({ Activation }) => !!Activation);
            });
            if (!addressesWithKeysToActivate.length) {
                return;
            }

            const mailboxPassword = authentication.getPassword();

            if (!mailboxPassword) {
                throw new Error('Password required to generate keys');
            }

            const activateAddressKeys = async (address: Address) => {
                const addressKeys = await getAddressKeys(address.ID);
                if (!addressKeys.length) {
                    return;
                }
                const primaryPrivateKey = addressKeys[0].privateKey;
                if (!primaryPrivateKey) {
                    // Should never happen in the initialization case, since these keys are decrypted with the activation token.
                    return;
                }
                const actionableAddressKeys = await getActionableKeysList(addressKeys);
                for (const addressKey of addressKeys) {
                    const {
                        Key: { ID: KeyID, Activation },
                        privateKey,
                    } = addressKey;
                    if (!Activation || !privateKey) {
                        // eslint-disable-next-line no-continue
                        return;
                    }
                    const encryptedPrivateKey = await encryptPrivateKey(privateKey, mailboxPassword);
                    const SignedKeyList = await getSignedKeyList(actionableAddressKeys, primaryPrivateKey);

                    await silentApi(activateKeyRoute({ ID: KeyID, PrivateKey: encryptedPrivateKey, SignedKeyList }));
                }
            };

            return Promise.all(addressesWithKeysToActivate.map(activateAddressKeys)).catch(traceError);
        };
        run().catch(noop);
    }, [addresses, user]);

    return <>{null}</>;
};

export default ReadableMemberKeyActivation;
