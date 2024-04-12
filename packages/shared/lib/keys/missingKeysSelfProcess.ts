import { Address, Api, DecryptedKey, KeyGenConfig, KeyTransparencyVerify } from '../interfaces';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
import { getHasMigratedAddressKeys } from './keyMigration';

type OnUpdateCallback = (ID: string, update: { status: 'loading' | 'error' | 'ok'; result?: string }) => void;

interface MissingKeysSelfProcessArguments {
    api: Api;
    userKeys: DecryptedKey[];
    keyGenConfig: KeyGenConfig;
    addresses: Address[];
    addressesToGenerate: Address[];
    password: string;
    onUpdate: OnUpdateCallback;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const missingKeysSelfProcess = ({
    api,
    userKeys,
    keyGenConfig,
    addresses,
    addressesToGenerate,
    password,
    onUpdate,
    keyTransparencyVerify,
}: MissingKeysSelfProcessArguments) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);

    return Promise.all(
        addressesToGenerate.map(async (address) => {
            try {
                onUpdate(address.ID, { status: 'loading' });

                if (hasMigratedAddressKeys) {
                    await createAddressKeyV2({
                        api,
                        address,
                        keyGenConfig,
                        userKeys,
                        activeKeys: [],
                        keyTransparencyVerify,
                    });
                } else {
                    await createAddressKeyLegacy({
                        api,
                        address,
                        keyGenConfig,
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
