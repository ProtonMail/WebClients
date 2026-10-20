import { getKeySalts } from '@proton/shared/lib/api/keys';
import { getPasswordPolicies, getShouldUsePasswordPolicies } from '@proton/shared/lib/api/passwordPolicies';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import type { User } from '@proton/shared/lib/interfaces/User';

export const getAccountKeySalts = (api: Api) =>
    api<{ KeySalts: KeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts);

/** The organization's password policies, for users who must replace a temporary password. */
export const getSignInPasswordPolicies = async ({ api, user }: { api: Api; user: User }) =>
    getShouldUsePasswordPolicies(user) ? getPasswordPolicies({ api }) : undefined;
