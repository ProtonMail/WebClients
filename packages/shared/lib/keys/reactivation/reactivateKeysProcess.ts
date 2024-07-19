import { getHasMigratedAddressKeys } from '../keyMigration';
import type { ReactivateKeysProcessLegacyArguments } from './reactivateKeysProcessLegacy';
import reactivateKeysProcessLegacy from './reactivateKeysProcessLegacy';
import type { ReactivateKeysProcessV2Arguments } from './reactivateKeysProcessV2';
import reactivateKeysProcessV2 from './reactivateKeysProcessV2';

interface Arguments extends ReactivateKeysProcessV2Arguments, ReactivateKeysProcessLegacyArguments {}

export const reactivateKeysProcess = async ({
    api,
    user,
    userKeys,
    addresses,
    addressesKeys,
    keyReactivationRecords,
    keyPassword,
    onReactivation,
    keyTransparencyVerify,
}: Arguments) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);

    if (hasMigratedAddressKeys) {
        return reactivateKeysProcessV2({
            api,
            keyReactivationRecords,
            keyPassword,
            user,
            userKeys,
            addresses,
            onReactivation,
            keyTransparencyVerify,
        });
    }

    return reactivateKeysProcessLegacy({
        api,
        keyReactivationRecords,
        userKeys,
        keyPassword,
        onReactivation,
        addressesKeys,
        keyTransparencyVerify,
    });
};
