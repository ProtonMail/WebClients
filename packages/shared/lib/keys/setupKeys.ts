import { srpVerify } from '../srp';
import { setupKeys } from '../api/keys';
import { Api, Address } from '../interfaces';
import { generateKeySaltAndPassphrase } from './keys';
import { getResetAddressesKeys, getResetAddressesKeysV2 } from './resetKeys';
import { hasAddressKeyMigration } from '../constants';

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

    const { userKeyPayload, addressKeysPayload } = hasAddressKeyMigration
        ? await getResetAddressesKeysV2({
              addresses,
              passphrase,
          })
        : await getResetAddressesKeys({ addresses, passphrase });

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
