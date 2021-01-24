import { getHasMigratedAddressKeys } from '../keyMigration';
import reactivateKeysProcessLegacy, { ReactivateKeysProcessLegacyArguments } from './reactivateKeysProcessLegacy';
import reactivateKeysProcessV2, { ReactivateKeysProcessV2Arguments } from './reactivateKeysProcessV2';

interface Arguments extends ReactivateKeysProcessV2Arguments, ReactivateKeysProcessLegacyArguments {}

export const reactivateKeysProcess = async ({
    api,
    user,
    userKeys,
    addresses,
    keyReactivationRecords,
    keyPassword,
    onReactivation,
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
        });
    }

    return reactivateKeysProcessLegacy({
        api,
        keyReactivationRecords,
        keyPassword,
        onReactivation,
    });
};
