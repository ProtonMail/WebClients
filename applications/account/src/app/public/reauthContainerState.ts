import type { AuthSession } from '@proton/components/containers/login/interface';
import type { ProduceForkParameters } from '@proton/shared/lib/authentication/fork';
import { getIsGlobalSSOAccount } from '@proton/shared/lib/keys';

export type ReAuthState = {
    session: AuthSession;
    reAuthType: ProduceForkParameters['promptType'];
};

// Different file for code-splitting purposes
export const getReAuthState = (
    forkParameters: Pick<ProduceForkParameters, 'prompt' | 'promptType' | 'promptBypass'> | undefined,
    session: AuthSession
): ReAuthState => {
    let reAuthType = forkParameters?.promptType ?? 'default';

    // Normalize the reauth type to 'default' (auth with IdP - instead of auth with backup password) for SSO accounts
    // ignoring if the offline key exists or not and 'sso' bypass is requested
    if (
        forkParameters?.promptBypass === 'sso' &&
        getIsGlobalSSOAccount(session.data.User) &&
        reAuthType !== 'default'
    ) {
        reAuthType = 'default';
    }

    return {
        session,
        reAuthType,
    };
};
