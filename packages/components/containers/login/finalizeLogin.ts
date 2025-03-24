import { revoke } from '@proton/shared/lib/api/auth';
import { getSettings, upgradePassword } from '@proton/shared/lib/api/settings';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { maybeResumeSessionByUser, persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import {
    attemptDeviceRecovery,
    getIsDeviceRecoveryAvailable,
    storeDeviceRecovery,
} from '@proton/shared/lib/recoveryFile/deviceRecovery';
import { removeDeviceRecovery } from '@proton/shared/lib/recoveryFile/storage';
import { srpVerify } from '@proton/shared/lib/srp';
import { AUTH_VERSION } from '@proton/srp';
import noop from '@proton/utils/noop';

import type { AuthActionResponse, AuthCacheResult } from './interface';
import { AuthStep } from './interface';
import { syncAddresses, syncUser } from './syncCache';

/**
 * Finalize login can be called without a key password in these cases:
 * 1) The admin panel
 * 2) Users who have no keys but are in 2-password mode
 */
export const finalizeLogin = async ({
    cache,
    loginPassword,
    keyPassword = '',
    clearKeyPassword = '',
    attemptResume = true,
    source = SessionSource.Proton,
}: {
    cache: AuthCacheResult;
    loginPassword: string;
    keyPassword?: string;
    clearKeyPassword?: string;
    attemptResume?: boolean;
    source?: SessionSource;
}): Promise<AuthActionResponse> => {
    const { authResponse, authVersion, api, persistent, appName, preAuthKTVerifier } = cache;

    if (authVersion < AUTH_VERSION) {
        await srpVerify({
            api,
            credentials: { password: loginPassword },
            config: upgradePassword(),
        });
    }

    if (appName === APPS.PROTONADMIN) {
        const user = cache.data.user || (await syncUser(cache));
        const trusted = false;

        const validatedSession = attemptResume
            ? await maybeResumeSessionByUser({
                  api,
                  User: user,
                  options: { source: null },
              })
            : null;
        if (validatedSession) {
            await api(revoke()).catch(noop);
            return {
                to: AuthStep.DONE,
                session: { data: validatedSession, loginPassword, flow: 'login' },
            };
        }

        const sessionResult = await persistSession({
            ...authResponse,
            clearKeyPassword,
            keyPassword,
            User: user,
            api,
            persistent,
            trusted,
            source,
        });

        return {
            to: AuthStep.DONE,
            session: {
                data: sessionResult,
                loginPassword,
                flow: 'login',
            },
        };
    }

    let user = cache.data.user || (await syncUser(cache));

    const resumedSessionResult = attemptResume
        ? await maybeResumeSessionByUser({
              api,
              User: user,
              // During proton login, ignore resuming an oauth session
              options: { source: [SessionSource.Saml, SessionSource.Proton] },
          })
        : null;
    if (resumedSessionResult) {
        await api(revoke()).catch(noop);
        return {
            to: AuthStep.DONE,
            session: { data: resumedSessionResult, loginPassword, flow: 'login' },
        };
    }

    let trusted = false;
    if (keyPassword) {
        let addresses = await (cache.data.addresses || syncAddresses(cache));
        const numberOfReactivatedKeys = await attemptDeviceRecovery({
            api,
            user,
            addresses,
            keyPassword,
            preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
        }).catch(noop);

        if (numberOfReactivatedKeys !== undefined && numberOfReactivatedKeys > 0) {
            cache.data.user = undefined;
            cache.data.addresses = undefined;
            [user, addresses] = await Promise.all([syncUser(cache), syncAddresses(cache)]);
        }

        // Store device recovery information
        if (persistent) {
            const [userKeys] = await Promise.all([getDecryptedUserKeysHelper(user, keyPassword)]);
            const isDeviceRecoveryAvailable = getIsDeviceRecoveryAvailable({
                user,
                addresses,
                userKeys,
                appName,
            });

            if (isDeviceRecoveryAvailable) {
                const userSettings = await api<{ UserSettings: UserSettings }>(getSettings()).then(
                    ({ UserSettings }) => UserSettings
                );

                if (userSettings.DeviceRecovery) {
                    const deviceRecoveryUpdated = await storeDeviceRecovery({ api, user, userKeys }).catch(noop);
                    if (deviceRecoveryUpdated) {
                        // Storing device recovery (when setting a new recovery secret) modifies the user object
                        cache.data.user = undefined;
                        user = await syncUser(cache);
                    }
                    trusted = true;
                }
            }
        } else {
            removeDeviceRecovery(user.ID);
        }
    }

    const sessionResult = await persistSession({
        ...authResponse,
        clearKeyPassword,
        keyPassword,
        User: user,
        api,
        persistent,
        trusted,
        source,
    });

    await preAuthKTVerifier.preAuthKTCommit(user.ID, api);

    return {
        to: AuthStep.DONE,
        session: {
            data: sessionResult,
            loginPassword,
            flow: 'login',
        },
    };
};
