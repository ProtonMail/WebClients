import { c } from 'ttag';

import { getAllAddresses } from '../api/addresses';
import { updateUsername } from '../api/settings';
import { getUser, queryCheckUsernameAvailability } from '../api/user';
import { Api, User as tsUser } from '../interfaces';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
import { getDecryptedUserKeysHelper } from './getDecryptedUserKeys';
import { getPrimaryKey } from './getPrimaryKey';
import { getHasMigratedAddressKeys } from './keyMigration';
import { handleSetupAddress } from './setupAddressKeys';
import { handleSetupKeys } from './setupKeys';

export type InternalAddressGenerationSetup =
    | {
          mode: 'ask';
      }
    | {
          mode: 'setup';
          loginPassword: string;
      }
    | {
          mode: 'create';
          keyPassword: string;
      };

export interface InternalAddressGenerationPayload {
    username: string;
    domain: string;
    setup: InternalAddressGenerationSetup;
}

export const getInternalAddressSetupMode = ({
    User,
    keyPassword,
    loginPassword,
}: {
    User: tsUser;
    keyPassword: string | undefined;
    loginPassword: string | undefined;
}): InternalAddressGenerationSetup => {
    if (User.Keys.length > 0) {
        if (!keyPassword) {
            throw new Error('Missing key password, should never happen');
        }
        return {
            mode: 'create',
            keyPassword,
        } as const;
    }
    if (!loginPassword) {
        return {
            mode: 'ask',
        };
    }
    return {
        mode: 'setup',
        loginPassword,
    };
};

const handleSetupUsernameAndAddress = async ({
    api,
    username,
    user,
    domain,
}: {
    api: Api;
    username: string;
    user: tsUser;
    domain: string;
}) => {
    if (!domain) {
        throw new Error(c('Error').t`Domain not available, try again later`);
    }

    const hasSetUsername = !!user.Name;

    // If the name is already set, fallback to what exists.
    const actualUsername = hasSetUsername ? user.Name : username;

    if (!hasSetUsername) {
        await api(queryCheckUsernameAvailability(actualUsername));
        await api(updateUsername({ Username: actualUsername }));
    }

    return handleSetupAddress({ api, domain, username: actualUsername });
};

export const handleCreateInternalAddressAndKey = async ({
    username,
    domain,
    api,
    passphrase,
}: {
    username: string;
    domain: string;
    api: Api;
    passphrase: string;
}) => {
    if (!passphrase) {
        throw new Error('Password required to generate keys');
    }
    const [user, addresses] = await Promise.all([
        api<{ User: tsUser }>(getUser()).then(({ User }) => User),
        getAllAddresses(api),
    ]);
    const [address] = await handleSetupUsernameAndAddress({ api, username, user, domain });
    if (getHasMigratedAddressKeys(addresses)) {
        const userKeys = await getDecryptedUserKeysHelper(user, passphrase);
        const primaryUserKey = getPrimaryKey(userKeys)?.privateKey;
        if (!primaryUserKey) {
            throw new Error('Missing primary user key');
        }
        await createAddressKeyV2({
            api,
            userKey: primaryUserKey,
            address,
            activeKeys: [],
        });
    } else {
        await createAddressKeyLegacy({
            api,
            passphrase: passphrase,
            address,
            activeKeys: [],
        });
    }

    return passphrase;
};

export const handleSetupInternalAddressAndKey = async ({
    username,
    domain,
    api,
    password,
}: {
    username: string;
    domain: string;
    api: Api;
    password: string;
}) => {
    if (!password) {
        throw new Error('Password required to setup keys');
    }
    const [user, addresses] = await Promise.all([
        api<{ User: tsUser }>(getUser()).then(({ User }) => User),
        getAllAddresses(api),
    ]);
    const createdAddresses = await handleSetupUsernameAndAddress({ api, username, user, domain });
    const addressesToSetup = [...addresses, ...createdAddresses];
    return handleSetupKeys({
        api,
        addresses: addressesToSetup,
        password,
        hasAddressKeyMigrationGeneration: user.ToMigrate === 1,
    });
};

export const handleInternalAddressGeneration = async ({
    username,
    domain,
    setup,
    api,
}: InternalAddressGenerationPayload & { api: Api }) => {
    if (setup.mode === 'create') {
        return handleCreateInternalAddressAndKey({ username, domain, api, passphrase: setup.keyPassword });
    }
    if (setup.mode === 'setup') {
        return handleSetupInternalAddressAndKey({
            username,
            domain,
            api,
            password: setup.loginPassword,
        });
    }
    throw new Error('Unknown internal address setup mode');
};
