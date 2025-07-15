import { revoke } from '@proton/shared/lib/api/auth';
import { upgradePassword } from '@proton/shared/lib/api/settings';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import {
    assertUniqueLocalID,
    maybeResumeSessionByUser,
    persistSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS } from '@proton/shared/lib/constants';
import { deviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecoveryHelper';
import { srpVerify } from '@proton/shared/lib/srp';
import { AUTH_VERSION } from '@proton/srp';
import noop from '@proton/utils/noop';

import type { AuthActionResponse, AuthCacheResult } from './interface';
import { AuthStep } from './interface';
import { syncUser } from './syncCache';

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

    const deviceRecoveryResult = await deviceRecovery({
        keyPassword,
        user,
        addresses: cache.data.addresses,
        api,
        persistent,
        appName,
        preAuthKTVerifier,
    });
    user = deviceRecoveryResult.user;

    await assertUniqueLocalID({ ...authResponse, api });

    const sessionResult = await persistSession({
        ...authResponse,
        clearKeyPassword,
        keyPassword,
        api,
        persistent,
        User: user,
        trusted: deviceRecoveryResult.trusted,
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
