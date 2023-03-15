import { Address, Api, DecryptedKey, EncryptionConfig, KeyTransparencyVerify } from '../interfaces';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
import { getPrimaryKey } from './getPrimaryKey';
import { getHasMigratedAddressKeys } from './keyMigration';

type OnUpdateCallback = (ID: string, update: { status: 'loading' | 'error' | 'ok'; result?: string }) => void;

interface MissingKeysSelfProcessArguments {
    api: Api;
    userKeys: DecryptedKey[];
    encryptionConfig: EncryptionConfig;
    addresses: Address[];
    addressesToGenerate: Address[];
    password: string;
    onUpdate: OnUpdateCallback;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const missingKeysSelfProcess = ({
    api,
    userKeys,
    encryptionConfig,
    addresses,
    addressesToGenerate,
    password,
    onUpdate,
    keyTransparencyVerify,
}: MissingKeysSelfProcessArguments) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);
    const primaryUserKey = getPrimaryKey(userKeys)?.privateKey;
    if (!primaryUserKey) {
        throw new Error('Missing primary user key');
    }

    return Promise.all(
        addressesToGenerate.map(async (address) => {
            try {
                onUpdate(address.ID, { status: 'loading' });

                if (hasMigratedAddressKeys) {
                    await createAddressKeyV2({
                        api,
                        address,
                        encryptionConfig,
                        userKey: primaryUserKey,
                        activeKeys: [],
                        keyTransparencyVerify,
                    });
                } else {
                    await createAddressKeyLegacy({
                        api,
                        address,
                        encryptionConfig,
                        passphrase: password,
                        activeKeys: [],
                        keyTransparencyVerify,
                    });
                }

                onUpdate(address.ID, { status: 'ok' });
            } catch (e: any) {
                onUpdate(address.ID, { status: 'error', result: e.message });
            }
        })
    );
};
