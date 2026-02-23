import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { serverTime, wasServerTimeEverUpdated } from '@proton/crypto';
import { createKeyMigrationKTVerifier } from '@proton/key-transparency/shared';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { APPS } from '@proton/shared/lib/constants';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import {
    activateMemberAddressKeys,
    generateAllPrivateMemberKeys,
    getAddressesWithKeysToActivate,
    getAddressesWithKeysToGenerate,
    getHasMigratedAddressKeys,
    getSentryError,
    hasActiveKeysMismatch,
    migrateMemberAddressKeys,
    migrateUser,
    updateActiveKeys,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { type AddressesState, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { type OrganizationState, organizationThunk } from '../organization';
import { type UserState, userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type AddressKeysState, addressKeysThunk } from './index';

export const runKeyBackgroundManager = (): ThunkAction<
    Promise<void>,
    UserState & KtState & AddressesState & AddressKeysState & UserKeysState & OrganizationState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const authentication = extra.authentication;
        const api = extra.api;
        const silentApi = getSilentApi(api);

        if (extra.config.APP_NAME === APPS.PROTONVPN_SETTINGS) {
            return;
        }

        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });

        const run = async () => {
            const [user, userKeys, addresses] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userKeysThunk()),
                dispatch(addressesThunk()),
            ]);
            const keyPassword = authentication.getPassword();

            const addressesWithKeysToActivate = getAddressesWithKeysToActivate(user, addresses);
            const activationPromise = addressesWithKeysToActivate.length
                ? Promise.all(
                      addressesWithKeysToActivate.map(async (address) => {
                          const addressKeys = await dispatch(addressKeysThunk({ addressID: address.ID }));
                          return activateMemberAddressKeys({
                              address,
                              addresses,
                              addressKeys,
                              userKeys,
                              keyPassword,
                              api: silentApi,
                              keyTransparencyVerify,
                          });
                      })
                  )
                      .then(async () => {
                          await keyTransparencyCommit(user, userKeys);
                          // Refetch all the addresses to get the updated key for the address
                          await dispatch(addressesThunk({ cache: CacheType.None }));
                      })
                      .catch(traceError)
                : undefined;

            const addressesWithKeysToGenerate = getAddressesWithKeysToGenerate(user, addresses);
            const generationPromise = addressesWithKeysToGenerate.length
                ? generateAllPrivateMemberKeys({
                      addresses,
                      addressesToGenerate: addressesWithKeysToGenerate,
                      userKeys,
                      keyPassword,
                      api: silentApi,
                      keyTransparencyVerify,
                  })
                      .then(async () => {
                          await keyTransparencyCommit(user, userKeys);
                          // Refetch all the addresses to get the updated key for the address
                          await dispatch(addressesThunk({ cache: CacheType.None }));
                      })
                      .catch(traceError)
                : undefined;
            return Promise.all([activationPromise, generationPromise]);
        };

        const runMigration = async () => {
            const [user, organization, addresses, userKeys] = await Promise.all([
                dispatch(userThunk()),
                dispatch(organizationThunk()),
                dispatch(addressesThunk()),
                dispatch(userKeysThunk()),
            ]);

            if (!(user.ToMigrate === 1 || organization.ToMigrate === 1)) {
                return;
            }

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

        const runActiveKeysCheck = async () => {
            const runActiveKeysCheckFlag = extra.unleashClient.isEnabled('CryptoDisableUndecryptableKeys');
            if (!runActiveKeysCheckFlag) {
                return;
            }
            try {
                const addresses = await dispatch(addressesThunk());
                const updatesHappened = await Promise.all(
                    addresses.map(async (address) => {
                        const addressKeys = await dispatch(addressKeysThunk({ addressID: address.ID }));
                        if (!hasActiveKeysMismatch(address, addressKeys)) {
                            return false;
                        }
                        await updateActiveKeys(silentApi, address, addressKeys, keyTransparencyVerify);
                        return true;
                    })
                );
                if (updatesHappened.some(Boolean)) {
                    const user = await dispatch(userThunk());
                    const userKeys = await dispatch(userKeysThunk());
                    await keyTransparencyCommit(user, userKeys);
                }
            } catch (error) {
                const sentryError = getSentryError(error);
                if (sentryError) {
                    captureMessage('Active keys check or update failed', {
                        extra: { sentryError, serverTime: serverTime(), isServerTime: wasServerTimeEverUpdated() },
                    });
                }
                throw error;
            }
        };

        run()
            .then(() =>
                runMigration().catch((e) => {
                    const error = getSentryError(e);
                    if (error) {
                        captureMessage('Key migration error', {
                            extra: { error, serverTime: serverTime(), isServerTime: wasServerTimeEverUpdated() },
                        });
                    }
                })
            )
            .then(() => runActiveKeysCheck())
            .catch(noop);
    };
};
