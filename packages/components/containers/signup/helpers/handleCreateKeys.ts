import { srpVerify } from 'proton-shared/lib/srp';
import { setupKeys } from 'proton-shared/lib/api/keys';
import { AddressKey, Api } from 'proton-shared/lib/interfaces';

interface Args {
    api: Api;
    salt: string;
    addressKeys: AddressKey[];
    password: string;
}
const handleCreateKeys = async ({ api, salt, addressKeys, password }: Args) => {
    if (!addressKeys.length) {
        throw new Error('An address is required to setup keys');
    }
    // Assume the primary address is the first item in the list.
    const [primaryAddress] = addressKeys;
    return srpVerify({
        api,
        credentials: { password },
        config: setupKeys({
            KeySalt: salt,
            PrimaryKey: primaryAddress.PrivateKey,
            AddressKeys: addressKeys,
        }),
    });
};

export default handleCreateKeys;
