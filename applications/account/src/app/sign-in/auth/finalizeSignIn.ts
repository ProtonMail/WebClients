import { AUTH_VERSION } from '@protontech/crypto/srp';

import { revoke } from '@proton/shared/lib/api/auth';
import { upgradePassword } from '@proton/shared/lib/api/settings';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import {
    assertUniqueLocalID,
    maybeResumeSessionByUser,
    persistSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Address, User } from '@proton/shared/lib/interfaces';
import { deviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecoveryHelper';
import { srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import type { AuthSession } from '../../content/authSession';
import type { LoginFlowContext } from './loginFlowContext';

export interface FinalizeSignInOptions {
    /** Fetched when missing, e.g. after the keys changed. */
    user: User | undefined;
    addresses: Address[] | undefined;
    loginPassword: string;
    keyPassword?: string;
    clearKeyPassword?: string;
    attemptResume?: boolean;
    source?: SessionSource;
}

/**
 * Creates (or resumes) the session once the account is unlocked.
 * Can be called without a key password for users who have no keys but are in 2-password mode.
 */
export const finalizeSignIn = async (
    { authResponse, authVersion, api, persistent, preAuthKTVerifier }: LoginFlowContext,
    {
        user: maybeUser,
        addresses,
        loginPassword,
        keyPassword = '',
        clearKeyPassword = '',
        attemptResume = true,
        source = SessionSource.Proton,
    }: FinalizeSignInOptions
): Promise<AuthSession> => {
    if (authVersion < AUTH_VERSION) {
        await srpVerify({
            api,
            credentials: { password: loginPassword },
            config: upgradePassword(),
        });
    }

    let user = maybeUser ?? (await getUser(api));

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
        return { data: resumedSessionResult, loginPassword, flow: 'login' };
    }

    const deviceRecoveryResult = await deviceRecovery({
        keyPassword,
        user,
        addresses,
        api,
        persistent,
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

    return { data: sessionResult, loginPassword, flow: 'login' };
};
