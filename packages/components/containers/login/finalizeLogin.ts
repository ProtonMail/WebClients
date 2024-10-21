import { revoke } from '@proton/shared/lib/api/auth';
import { getSettings, upgradePassword } from '@proton/shared/lib/api/settings';
import { maybeResumeSessionByUser, persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import {
    attemptDeviceRecovery,
    getIsDeviceRecoveryAvailable,
    removeDeviceRecovery,
    storeDeviceRecovery,
} from '@proton/shared/lib/recoveryFile/deviceRecovery';
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
    keyPassword,
    clearKeyPassword,
    attemptResume = true,
}: {
    cache: AuthCacheResult;
    loginPassword: string;
    keyPassword?: string;
    clearKeyPassword?: string;
    attemptResume?: boolean;
}): Promise<AuthActionResponse> => {
    const { authResponse, authVersion, api, persistent, appName, preAuthKTVerifier } = cache;

    if (authVersion < AUTH_VERSION) {
        await srpVerify({
            api,
            credentials: { password: loginPassword },
            config: upgradePassword(),
        });
    }

    if (appName !== APPS.PROTONACCOUNT) {
        const user = cache.data.user || (await syncUser(cache));
        const trusted = false;

        const { clientKey, offlineKey } = await persistSession({
            ...authResponse,
            clearKeyPassword: clearKeyPassword || '',
            keyPassword,
            User: user,
            api,
            persistent,
            trusted,
        });

        return {
            to: AuthStep.DONE,
            session: {
                ...authResponse,
                keyPassword,
                clientKey,
                offlineKey,
                loginPassword,
                persistent,
                trusted,
                User: user,
                flow: 'login',
            },
        };
    }

    let [user, addresses] = await Promise.all([
        cache.data.user || syncUser(cache),
        cache.data.addresses || syncAddresses(cache),
    ]);

    const validatedSession = attemptResume ? await maybeResumeSessionByUser(api, user) : null;
    if (validatedSession) {
        await api(revoke()).catch(noop);
        return {
            to: AuthStep.DONE,
            session: { ...validatedSession, loginPassword, flow: 'login' },
        };
    }

    let trusted = false;
    if (keyPassword) {
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

    const { clientKey, offlineKey } = await persistSession({
        ...authResponse,
        clearKeyPassword: clearKeyPassword || '',
        keyPassword,
        User: user,
        api,
        persistent,
        trusted,
    });

    await preAuthKTVerifier.preAuthKTCommit(user.ID, api);

    return {
        to: AuthStep.DONE,
        session: {
            ...authResponse,
            keyPassword,
            loginPassword,
            offlineKey,
            clientKey,
            persistent,
            trusted,
            User: user,
            flow: 'login',
        },
    };
};
