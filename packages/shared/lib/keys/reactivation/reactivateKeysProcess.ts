import { getHasMigratedAddressKeys } from '../keyMigration';
import type { ReactivateKeysProcessV2Arguments } from './reactivateKeysProcessV2';
import reactivateKeysProcessV2 from './reactivateKeysProcessV2';

export const reactivateKeysProcess = async ({
    api,
    user,
    userKeys,
    addresses,
    keyReactivationRecords,
    keyPassword,
    keyTransparencyVerify,
}: ReactivateKeysProcessV2Arguments) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);

    if (!hasMigratedAddressKeys) {
        // this should be unreachable migration runs on either on login or password reset
        throw new Error('Migrated address keys expected');
    }

    return reactivateKeysProcessV2({
        api,
        keyReactivationRecords,
        keyPassword,
        user,
        userKeys,
        addresses,
        keyTransparencyVerify,
    });
};
