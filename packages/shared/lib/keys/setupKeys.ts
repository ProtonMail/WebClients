import { setupKeys } from '../api/keys';
import { Address, Api } from '../interfaces';
import { srpVerify } from '../srp';
import { generateKeySaltAndPassphrase } from './keys';
import { getResetAddressesKeys } from './resetKeys';

interface Args {
    api: Api;
    addresses: Address[];
    password: string;
}

export const handleSetupKeys = async ({ api, addresses, password }: Args) => {
    if (!addresses.length) {
        throw new Error('An address is required to setup keys');
    }
    const { passphrase, salt } = await generateKeySaltAndPassphrase(password);

    const { userKeyPayload, addressKeysPayload } = await getResetAddressesKeys({
        addresses,
        passphrase,
        hasAddressKeyMigrationGeneration: true,
    });

    if (!userKeyPayload || !addressKeysPayload) {
        throw new Error('Invalid setup');
    }

    await srpVerify({
        api,
        credentials: { password },
        config: setupKeys({
            KeySalt: salt,
            PrimaryKey: userKeyPayload,
            AddressKeys: addressKeysPayload,
        }),
    });

    return passphrase;
};
