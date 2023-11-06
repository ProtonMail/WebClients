import { setupKeys } from '../api/keys';
import { Address, Api, PreAuthKTVerify } from '../interfaces';
import { srpVerify } from '../srp';
import { generateKeySaltAndPassphrase } from './keys';
import { getResetAddressesKeysV2 } from './resetKeys';

interface Args {
    api: Api;
    addresses: Address[];
    password: string;
    preAuthKTVerify: PreAuthKTVerify;
}

export const handleSetupKeys = async ({ api, addresses, password, preAuthKTVerify }: Args) => {
    if (!addresses.length) {
        throw new Error('An address is required to setup keys');
    }
    const { passphrase, salt } = await generateKeySaltAndPassphrase(password);

    const { userKeyPayload, addressKeysPayload, onSKLPublishSuccess } = await getResetAddressesKeysV2({
        addresses,
        passphrase,
        preAuthKTVerify,
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

    if (onSKLPublishSuccess) {
        await onSKLPublishSuccess();
    }

    return passphrase;
};
