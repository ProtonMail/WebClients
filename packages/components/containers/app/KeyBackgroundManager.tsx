import { useEffect } from 'react';

import { useGetKTActivation } from '@proton/components/containers/keyTransparency/useKTActivation';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { serverTime, wasServerTimeEverUpdated } from '@proton/crypto';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import { createKeyMigrationKTVerifier } from '@proton/shared/lib/keyTransparency';
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
import { useGetFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import {
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useGetOrganization,
    useGetUser,
    useGetUserKeys,
} from '../../hooks';
import useApi from '../../hooks/useApi';

interface Props {
    hasPrivateMemberKeyGeneration?: boolean;
    hasReadableMemberKeyActivation?: boolean;
    hasMemberKeyMigration?: boolean;
}

const KeyBackgroundManager = ({
    hasPrivateMemberKeyGeneration = false,
    hasReadableMemberKeyActivation = false,
    hasMemberKeyMigration = false,
}: Props) => {
    const getUser = useGetUser();
    const getUserKeys = useGetUserKeys();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getOrganization = useGetOrganization();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(silentApi, getUser);
    const getKTActivation = useGetKTActivation();
    const getFlag = useGetFlag();

    useEffect(() => {
        const run = async () => {
            const [user, userKeys, addresses] = await Promise.all([getUser(), getUserKeys(), getAddresses()]);
            const keyPassword = authentication.getPassword();

            const addressesWithKeysToActivate = hasReadableMemberKeyActivation
                ? getAddressesWithKeysToActivate(user, addresses)
                : [];
            const activationPromise = addressesWithKeysToActivate.length
                ? Promise.all(
                      addressesWithKeysToActivate.map(async (address) => {
                          const addressKeys = await getAddressKeys(address.ID);
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
                          await keyTransparencyCommit(userKeys);
                          await call();
                      })
                      .catch(traceError)
                : undefined;

            const addressesWithKeysToGenerate = hasPrivateMemberKeyGeneration
                ? getAddressesWithKeysToGenerate(user, addresses)
                : [];
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
                          await keyTransparencyCommit(userKeys);
                          await call();
                      })
                      .catch(traceError)
                : undefined;
            return Promise.all([activationPromise, generationPromise]);
        };

        const runMigration = async () => {
            const [user, organization, addresses, userKeys] = await Promise.all([
                getUser(),
                getOrganization(),
                getAddresses(),
                getUserKeys(),
            ]);

            if (!(user.ToMigrate === 1 || organization.ToMigrate === 1)) {
                return;
            }

            const keyPassword = authentication.getPassword();
            let hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);
            const ktActivation = await getKTActivation();
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
                await keyTransparencyCommit(userKeys);
                // Force a refresh directly so they're good to be used
                await call();
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

                if (typeof hasDoneAddressKeysMigration === 'undefined') {
                    await keyTransparencyCommit(userKeys);
                }
            }
        };

        const runActiveKeysCheck = async () => {
            const runActiveKeysCheckFlag = getFlag('CryptoDisableUndecryptableKeys');
            if (!runActiveKeysCheckFlag) {
                return;
            }
            try {
                const addresses = await getAddresses();
                const updatesHappened = await Promise.all(
                    addresses.map(async (address) => {
                        const addressKeys = await getAddressKeys(address.ID);
                        if (!hasActiveKeysMismatch(address, addressKeys)) {
                            return false;
                        }
                        await updateActiveKeys(silentApi, address, addressKeys, keyTransparencyVerify);
                        return true;
                    })
                );
                if (updatesHappened.some(Boolean)) {
                    const userKeys = await getUserKeys();
                    await keyTransparencyCommit(userKeys);
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

        if (!(hasMemberKeyMigration || hasPrivateMemberKeyGeneration || hasReadableMemberKeyActivation)) {
            void runActiveKeysCheck().catch(noop);
            return;
        }

        void run()
            .then(() =>
                hasMemberKeyMigration
                    ? runMigration().catch((e) => {
                          const error = getSentryError(e);
                          if (error) {
                              captureMessage('Key migration error', {
                                  extra: { error, serverTime: serverTime(), isServerTime: wasServerTimeEverUpdated() },
                              });
                          }
                      })
                    : undefined
            )
            .then(() => runActiveKeysCheck())
            .catch(noop);
    }, []);

    return <>{null}</>;
};

export default KeyBackgroundManager;
