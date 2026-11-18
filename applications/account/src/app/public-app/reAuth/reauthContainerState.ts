import type { ProduceForkParameters } from '@proton/shared/lib/authentication/fork/produce';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { getIsGlobalSSOAccount } from '@proton/shared/lib/keys/accountType';
import { getOrganizationSettings } from '@proton/shared/lib/organization/api';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import type { AuthSession } from '../authSession';

export type ReAuthState = {
    session: AuthSession;
    reAuthType: ProduceForkParameters['promptType'];
};

// Different file for code-splitting purposes
export const getReAuthState = async (
    forkParameters: Pick<ProduceForkParameters, 'prompt' | 'promptType' | 'promptBypass'>,
    session: AuthSession,
    api: Api
): Promise<ReAuthState> => {
    let reAuthType = forkParameters.promptType;
    const { User } = session.data;
    const isGlobalSSOAccount = getIsGlobalSSOAccount(User);

    // Only loaded when the backup password form can show. Admins keep their backup password, like in the API's SSO sign-in
    const backupPasswordDisabled =
        reAuthType !== 'default' &&
        forkParameters.promptBypass !== 'sso' &&
        isGlobalSSOAccount &&
        !isAdmin(User) &&
        (await getOrganizationSettings({ api })).SSOBackupPasswordDisabled;

    // Normalize the reauth type to 'default' (auth with IdP - instead of auth with backup password) for SSO accounts
    // ignoring if the offline key exists or not when 'sso' bypass is requested, or when the organization disabled the
    // backup password, since the member has none to enter
    if (
        reAuthType !== 'default' &&
        isGlobalSSOAccount &&
        (forkParameters.promptBypass === 'sso' || backupPasswordDisabled)
    ) {
        reAuthType = 'default';
    }

    return {
        session,
        reAuthType,
    };
};
