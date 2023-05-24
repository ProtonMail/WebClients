import { useEffect } from 'react';

import { serverTime, wasServerTimeEverUpdated } from '@proton/crypto';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import { User } from '@proton/shared/lib/interfaces';
import {
    activateMemberAddressKeys,
    generateAllPrivateMemberKeys,
    getAddressesWithKeysToActivate,
    getAddressesWithKeysToGenerate,
    getDecryptedUserKeysHelper,
    getHasMigratedAddressKeys,
    getSentryError,
    migrateMemberAddressKeys,
    migrateUser,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import {
    useAuthentication,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useGetOrganization,
    useGetUser,
    useGetUserKeys,
} from '../../hooks';
import useApi from '../../hooks/useApi';
import { useKTVerifier, useKeyMigrationKTVerifier } from '../keyTransparency';

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
    const { subscribe, call } = useEventManager();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(silentApi, getUser);
    const { keyMigrationKTVerifier } = useKeyMigrationKTVerifier();

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

        if (!(hasMemberKeyMigration || hasPrivateMemberKeyGeneration || hasReadableMemberKeyActivation)) {
            return;
        }

        run()
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
            .catch(noop);
    }, []);

    useEffect(() => {
        const assertDecryptable = async (user: User) => {
            if (!user?.Keys?.length) {
                return;
            }
            // This asserts that when a key update arrives, the client still has the correct key password for it.
            // Otherwise, it may invalidly be used. This is dangerous because it could potentially break keys.
            // One example where this happened was during a password reset where from the client perspective
            // it looked like an API call to update user keys failed (timed out) however, it actually succeeded
            // and the client kept using the old password. Since this is rare and should not happen, we just
            // sign out the user in lack of a better UX.
            const copy = { ...user, Keys: [user.Keys[0]] }; // Only interested in the primary key.
            const result = await getDecryptedUserKeysHelper(copy, authentication.getPassword());
            if (!result.length) {
                authentication.logout();
            }
        };
        return subscribe(({ User }) => {
            assertDecryptable(User).catch(noop);
        });
    }, []);

    return <>{null}</>;
};

export default KeyBackgroundManager;
