import React, { useEffect } from 'react';
import { Address, UserModel as tsUserModel } from 'proton-shared/lib/interfaces';
import {
    ADDRESS_STATUS,
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    MEMBER_PRIVATE,
} from 'proton-shared/lib/constants';
import { generateAddressKey } from 'proton-shared/lib/keys/keys';
import { traceError } from 'proton-shared/lib/helpers/sentry';
import { noop } from 'proton-shared/lib/helpers/function';

import { useApi, useAuthentication, useEventManager } from '../../hooks';
import createKeyHelper from '../keys/addKey/createKeyHelper';

interface Props {
    user?: tsUserModel;
    addresses?: Address[];
}
const PrivateMemberKeyGeneration = ({ addresses, user }: Props) => {
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    useEffect(() => {
        const run = async () => {
            if (!user || !addresses) {
                return;
            }
            // If signed in as subuser, or not a private user
            if (user.OrganizationPrivateKey || user.Private !== MEMBER_PRIVATE.UNREADABLE) {
                return;
            }
            // Any enabled address without keys
            const addressesWithKeysToGenerate = addresses.filter(({ Status, Keys = [] }) => {
                return Status === ADDRESS_STATUS.STATUS_ENABLED && !Keys.length;
            });
            if (!addressesWithKeysToGenerate.length) {
                return;
            }

            const mailboxPassword = authentication.getPassword();

            if (!mailboxPassword) {
                throw new Error('Password required to generate keys');
            }

            const generateAddressKeys = async (address: Address) => {
                const { privateKey, privateKeyArmored } = await generateAddressKey({
                    email: address.Email,
                    passphrase: mailboxPassword,
                    encryptionConfig: ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
                });

                await createKeyHelper({
                    api: silentApi,
                    privateKeyArmored,
                    privateKey,
                    Address: address,
                    parsedKeys: [],
                    actionableKeys: [],
                    signingKey: privateKey,
                });
            };

            await Promise.all(addressesWithKeysToGenerate.map(generateAddressKeys)).catch(traceError);
            await call();
        };
        run().catch(noop);
    }, [addresses, user]);

    return <>{null}</>;
};

export default PrivateMemberKeyGeneration;
