import { updatePrivateKeyRoute } from '@proton/shared/lib/api/keys';
import type { Api, DecryptedKey, User } from '@proton/shared/lib/interfaces';
import { getUpdateKeysPayload } from '@proton/shared/lib/keys/changePassword';
import type { DeviceSecretData } from '@proton/shared/lib/keys/device';
import { encryptAuthDeviceSecret } from '@proton/shared/lib/keys/device';
import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { srpVerify } from '@proton/shared/lib/srp';

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
