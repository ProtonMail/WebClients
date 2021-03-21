import { c } from 'ttag';
import { Address as tsAddress, Api, User as tsUser } from '../interfaces';
import { getUser, queryCheckUsernameAvailability } from '../api/user';
import { queryAddresses } from '../api/addresses';
import { updateUsername } from '../api/settings';
import { handleSetupAddress } from './setupAddressKeys';
import { getHasMigratedAddressKeys } from './keyMigration';
import { getDecryptedUserKeys } from './getDecryptedUserKeys';
import { getPrimaryKey } from './getPrimaryKey';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';

interface Props {
    username: string;
    keyPassword: string;
    domain: string;
    api: Api;
}

export const handleCreateInternalAddressAndKey = async ({ username, keyPassword, domain, api }: Props) => {
    if (!keyPassword) {
        throw new Error('Password required to generate keys');
    }

    if (!domain) {
        const error = c('Error').t`Domain not available, try again later`;
        throw new Error(error);
    }

    const [user, addresses] = await Promise.all([
        api<{ User: tsUser }>(getUser()).then(({ User }) => User),
        api<{ Addresses: tsAddress[] }>(queryAddresses()).then(({ Addresses }) => Addresses),
    ]);

    const hasSetUsername = !!user.Name;

    // If the name is already set, fallback to what exists.
    const actualUsername = hasSetUsername ? user.Name : username;

    if (!hasSetUsername) {
        await api(queryCheckUsernameAvailability(actualUsername));
        await api(updateUsername({ Username: actualUsername }));
    }

    const [Address] = await handleSetupAddress({ api, domains: [domain], username: actualUsername });

    if (getHasMigratedAddressKeys(addresses)) {
        const userKeys = await getDecryptedUserKeys({
            user,
            userKeys: user.Keys,
            keyPassword,
        });
        const primaryUserKey = getPrimaryKey(userKeys)?.privateKey;
        if (!primaryUserKey) {
            throw new Error('Missing primary user key');
        }
        await createAddressKeyV2({
            api,
            userKey: primaryUserKey,
            address: Address,
            activeKeys: [],
        });
    } else {
        await createAddressKeyLegacy({
            api,
            passphrase: keyPassword,
            address: Address,
            activeKeys: [],
        });
    }
};
