import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import { createKeyMigrationKTVerifier } from '@proton/key-transparency/shared';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getHasMigratedAddressKeys, migrateMemberAddressKeys, migrateUser } from '@proton/shared/lib/keys';

import { type AddressesState, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { type OrganizationState, organizationThunk } from '../organization';
import { type UserState, userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';

export const migrateKeysThunk = (): ThunkAction<
    Promise<void>,
    KtState & UserState & AddressesState & UserKeysState & OrganizationState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);

        if (!(user.ToMigrate === 1 || organization.ToMigrate === 1)) {
            return;
        }

        const [addresses, userKeys] = await Promise.all([dispatch(addressesThunk()), dispatch(userKeysThunk())]);

        const api = extra.api;
        const silentApi = getSilentApi(api);

        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api: silentApi,
            config: extra.config,
        });

        const authentication = extra.authentication;

        const keyPassword = authentication.getPassword();
        let hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);
        const ktActivation = dispatch(getKTActivation());
        const keyMigrationKTVerifier = createKeyMigrationKTVerifier(ktActivation);

        const hasDoneMigration = await migrateUser({
            api: silentApi,
            user,
            keyPassword,
            addresses,
            preAuthKTVerify: () => keyTransparencyVerify,
            keyMigrationKTVerifier,
        });

        if (hasDoneMigration) {
            await keyTransparencyCommit(user, userKeys);
            // Force a refresh directly so they're good to be used
            await Promise.all([
                // Refetch the user to get the update keys
                dispatch(userThunk({ cache: CacheType.None })),
                // Refetch all the addresses to get the updated key for the address
                dispatch(addressesThunk({ cache: CacheType.None })),
            ]);
            hasMigratedAddressKeys = true;
        }

        if (hasMigratedAddressKeys) {
            const hasDoneAddressKeysMigration = await migrateMemberAddressKeys({
                api: silentApi,
                user,
                organization,
                keyPassword,
                keyTransparencyVerify,
                keyMigrationKTVerifier,
            });

            if (hasDoneAddressKeysMigration) {
                await keyTransparencyCommit(user, userKeys);
            }
        }
    };
};
