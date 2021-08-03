import { srpVerify } from '../srp';
import { setupKeys } from '../api/keys';
import { Api, Address } from '../interfaces';
import { generateKeySaltAndPassphrase } from './keys';
import { getResetAddressesKeys } from './resetKeys';

interface Args {
    api: Api;
    addresses: Address[];
    password: string;
    hasAddressKeyMigrationGeneration: boolean;
}

export const handleSetupKeys = async ({ api, addresses, password, hasAddressKeyMigrationGeneration }: Args) => {
    if (!addresses.length) {
        throw new Error('An address is required to setup keys');
    }
    const { passphrase, salt } = await generateKeySaltAndPassphrase(password);

    const { userKeyPayload, addressKeysPayload } = await getResetAddressesKeys({
        addresses,
        passphrase,
        hasAddressKeyMigrationGeneration,
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
