import { useEffect } from 'react';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    activateMemberAddressKeys,
    getAddressesWithKeysToActivate,
    generateAllPrivateMemberKeys,
    getAddressesWithKeysToGenerate,
    migrateMemberAddressKeys,
    getHasKeyMigrationRunner,
    getHasMigratedAddressKeys,
    getDecryptedUserKeysHelper,
    migrateUser,
    restoreBrokenSKL,
} from '@proton/shared/lib/keys';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import { User } from '@proton/shared/lib/interfaces';

import {
    useAuthentication,
    useEventManager,
    useGetAddresses,
    useGetAddressKeys,
    useGetUser,
    useGetUserKeys,
    useFeature,
    useGetOrganization,
} from '../../hooks';

import useApi from '../../hooks/useApi';
import { FeatureCode } from '../features';

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
    const keyMigrationFeature = useFeature(FeatureCode.KeyMigration, false);

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
                          });
                      })
                  )
                      .then(call)
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
                  })
                      .then(call)
                      .catch(traceError)
                : undefined;
            return Promise.all([activationPromise, generationPromise]);
        };

        const runMigration = async () => {
            const [user, organization, addresses] = await Promise.all([getUser(), getOrganization(), getAddresses()]);

            if (!(user.ToMigrate === 1 || organization.ToMigrate === 1)) {
                return;
            }

            const keyMigrationFeatureValue = await keyMigrationFeature
                .get<number>()
                .then(({ Value }) => Value)
                .catch(() => 0);

            if (!getHasKeyMigrationRunner(keyMigrationFeatureValue)) {
                return;
            }

            const keyPassword = authentication.getPassword();
            let hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);

            const hasDoneMigration = await migrateUser({
                api: silentApi,
                user,
                keyPassword,
                addresses,
            });

            if (hasDoneMigration) {
                // Force a refresh directly so they're good to be used
                await call();
                hasMigratedAddressKeys = true;
            }

            if (hasMigratedAddressKeys) {
                await migrateMemberAddressKeys({
                    api: silentApi,
                    user,
                    organization,
                    keyPassword,
                });
            }
        };

        const runBrokenSKLRestoration = async () => {
            const [user, organization] = await Promise.all([getUser(), getOrganization()]);

            if (!organization.BrokenSKL) {
                return;
            }

            await restoreBrokenSKL({
                api: silentApi,
                user,
                keyPassword: authentication.getPassword(),
            });
        };

        if (!(hasMemberKeyMigration || hasPrivateMemberKeyGeneration || hasReadableMemberKeyActivation)) {
            return;
        }

        run()
            .then(() =>
                hasMemberKeyMigration
                    ? runMigration()
                          .catch((e) => {
                              captureMessage('Key migration error', { extra: { error: e } });
                          })
                          .then(runBrokenSKLRestoration)
                          .catch((e) => {
                              captureMessage('Key SKL restoration error', { extra: { error: e } });
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
