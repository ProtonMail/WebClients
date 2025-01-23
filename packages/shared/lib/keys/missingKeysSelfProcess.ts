import type { Address, Api, DecryptedKey, KeyGenConfig, KeyTransparencyVerify } from '../interfaces';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
import { getHasMigratedAddressKeys } from './keyMigration';

type OnUpdateCallback = (ID: string, update: { status: 'loading' | 'error' | 'ok'; result?: string }) => void;

interface MissingKeysSelfProcessArguments {
    api: Api;
    userKeys: DecryptedKey[];
    keyGenConfig: KeyGenConfig; // only v4 keys generated for now
    addresses: Address[];
    addressesToGenerate: Address[];
    password: string;
    onUpdate?: OnUpdateCallback;
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
                onUpdate?.(address.ID, { status: 'loading' });

                if (hasMigratedAddressKeys) {
                    await createAddressKeyV2({
                        api,
                        address,
                        keyGenConfig,
                        userKeys,
                        activeKeys: { v4: [], v6: [] },
                        keyTransparencyVerify,
                    });
                } else {
                    await createAddressKeyLegacy({
                        api,
                        address,
                        keyGenConfig,
                        passphrase: password,
                        activeKeys: { v4: [], v6: [] },
                        keyTransparencyVerify,
                    });
                }
                onUpdate?.(address.ID, { status: 'ok' });

                return { type: 'success' };
            } catch (e: any) {
                onUpdate?.(address.ID, { status: 'error', result: e.message });

                return { type: 'error', e };
            }
        })
    );
};
