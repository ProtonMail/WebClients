import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '../constants';
import type { Address, Api, DecryptedKey, KeyGenConfig, KeyTransparencyVerify } from '../interfaces';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
import { getHasMigratedAddressKeys } from './keyMigration';

type OnUpdateCallback = (ID: string, update: { status: 'loading' | 'error' | 'ok'; result?: string }) => void;

interface MissingKeysSelfProcessArguments {
    api: Api;
    userKeys: DecryptedKey[];
    supportV6Keys: boolean;
    keyGenConfigForV4Keys?: KeyGenConfig; // no option for v6
    addresses: Address[];
    addressesToGenerate: Address[];
    password: string;
    onUpdate?: OnUpdateCallback;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const missingKeysSelfProcess = ({
    api,
    userKeys,
    supportV6Keys,
    keyGenConfigForV4Keys,
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
                    const [, updatedActiveKeys] = await createAddressKeyV2({
                        api,
                        address,
                        keyGenConfig: keyGenConfigForV4Keys,
                        userKeys,
                        activeKeys: { v4: [], v6: [] },
                        keyTransparencyVerify,
                    });
                    if (supportV6Keys) {
                        await createAddressKeyV2({
                            api,
                            address,
                            keyGenConfig: KEYGEN_CONFIGS[KEYGEN_TYPES.PQC],
                            userKeys,
                            activeKeys: updatedActiveKeys,
                            keyTransparencyVerify,
                        });
                    }
                } else {
                    // sanity check
                    if (supportV6Keys) {
                        throw new Error('Cannot generate v6 keys with non-migrated address');
                    }
                    await createAddressKeyLegacy({
                        api,
                        address,
                        keyGenConfig: keyGenConfigForV4Keys,
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
