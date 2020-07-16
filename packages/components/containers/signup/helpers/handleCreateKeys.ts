import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import { getResetAddressesKeys } from 'proton-shared/lib/keys/resetKeys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';
import { srpVerify } from 'proton-shared/lib/srp';
import { setupKeys } from 'proton-shared/lib/api/keys';
import { Address, Api } from 'proton-shared/lib/interfaces';

interface Args {
    api: Api;
    password: string;
    addresses: Address[];
}
const handleCreateKeys = async ({ api, password, addresses }: Args) => {
    if (!addresses.length) {
        throw new Error('An address is required to setup keys');
    }
    const { passphrase, salt } = await generateKeySaltAndPassphrase(password);
    const newAddressesKeys = await getResetAddressesKeys({
        addresses,
        passphrase,
        encryptionConfig: ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG]
    });
    // Assume the primary address is the first item in the list.
    const [primaryAddress] = newAddressesKeys;
    return srpVerify({
        api,
        credentials: { password },
        config: setupKeys({
            KeySalt: salt,
            PrimaryKey: primaryAddress.PrivateKey,
            AddressKeys: newAddressesKeys
        })
    });
};

export default handleCreateKeys;
