import { setupKeys } from '../api/keys';
import { getUser } from '../api/user';
import { Address, Api, PreAuthKTVerify, User } from '../interfaces';
import { srpVerify } from '../srp';
import { getDecryptedUserKeysHelper } from './getDecryptedUserKeys';
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

    const verifySuccess = async () => {
        const user = await api<{ User: User }>(getUser()).then(({ User }) => User);
        const decryptedKeys = await getDecryptedUserKeysHelper(user, passphrase);
        if (!decryptedKeys.length) {
            throw new Error('Failed to setup keys');
        }
    };

    try {
        await srpVerify({
            api,
            credentials: { password },
            config: setupKeys({
                KeySalt: salt,
                PrimaryKey: userKeyPayload,
                AddressKeys: addressKeysPayload,
            }),
        });
    } catch (setupError) {
        // We are observing some strange behavior where the setup call seems to be retried even though it has succeeded.
        // One theory might be that the request is retried natively by the browser (even POST requests) according to
        // "Client Behavior if Server Prematurely Closes Connection is to retry the request". This is attempting to fix that.
        // We don't care about the status code because it could be valid for requests that time out or offline as well.
        try {
            await verifySuccess();
            // It succeeded setting up the keys with this passphrase
        } catch (newError) {
            throw setupError;
        }
    }

    if (onSKLPublishSuccess) {
        await onSKLPublishSuccess();
    }

    return passphrase;
};
