import { updatePrivateKeyRoute } from '../api/keys';
import type { Api, DecryptedKey, User } from '../interfaces';
import { srpVerify } from '../srp';
import { getUpdateKeysPayload } from './changePassword';
import type { DeviceSecretData } from './device';
import { encryptAuthDeviceSecret } from './device';
import { generateKeySaltAndPassphrase } from './keys';

export const changeSSOUserKeysPasswordHelper = async ({
    newBackupPassword,
    deviceSecretData,
    api,
    userKeys,
}: {
    api: Api;
    user: User;
    userKeys: DecryptedKey[];
    deviceSecretData: DeviceSecretData;
    newBackupPassword: string;
}) => {
    const { passphrase: keyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(newBackupPassword);

    const updateKeysPayload = await getUpdateKeysPayload({
        addressesKeys: [], // Assuming always migrated keys
        userKeys,
        organizationKey: undefined,
        keyPassword,
        keySalt,
        forceMigratedAddressKeys: true,
    });

    const encryptedSecret = await encryptAuthDeviceSecret({
        keyPassword,
        deviceSecretData,
    });

    await srpVerify({
        api,
        credentials: {
            password: newBackupPassword,
        },
        config: updatePrivateKeyRoute({ ...updateKeysPayload, EncryptedSecret: encryptedSecret }),
    });

    return { keyPassword, encryptedSecret };
};
