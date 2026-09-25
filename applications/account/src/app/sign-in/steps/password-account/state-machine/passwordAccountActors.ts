import { fromPromise } from 'xstate';

import type { TwoFactorCredentials } from '@proton/shared/lib/api/auth';
import type { OrganizationData } from '@proton/shared/lib/keys/unprivatization/helper';

import type { AuthSession } from '../../../../content/authSession';
import { getSignInPasswordPolicies } from '../../../auth/accountData';
import { setupAccountKeys, unlockAccountKeys } from '../../../auth/accountKeys';
import { finalizeSignIn } from '../../../auth/finalizeSignIn';
import { verifyTwoFactor } from '../../../auth/secondFactor';
import { type AccountFlowInput, NO_PASSWORD_POLICIES } from '../../../state-machine/accountFlow';
import { createAccountFlowActors, getUserAndSalts } from '../../../state-machine/accountFlowActors';
import type { SignInActorServices } from '../../../state-machine/signInActors';
import { type SignInAuthState, toLoginFlowContext } from '../../../state-machine/signInAuthState';
import { createLost2FAFlow } from '../screens/lost-two-factor/state-machine/verificationActors';

/** The password account flow's actors, built from the app's services; `useSignInMachine` provides them. */
export const createPasswordAccountActors = (services: SignInActorServices) => {
    const { api } = services;
    const contextOf = (auth: SignInAuthState) => toLoginFlowContext(auth, services);

    return {
        ...createAccountFlowActors(services),
        lostTwoFactorFlow: createLost2FAFlow(services),
        verifyTwoFactor: fromPromise<void, { credentials: TwoFactorCredentials }>(({ input }) =>
            verifyTwoFactor({ api, credentials: input.credentials })
        ),
        /** The organization's rules for the new password; none when the account doesn't follow any. */
        loadPasswordPolicies: fromPromise<OrganizationData['passwordPolicies'], AccountFlowInput>(async ({ input }) => {
            const user = input.auth.account.user;
            return (user && (await getSignInPasswordPolicies({ api, user }))) || NO_PASSWORD_POLICIES;
        }),
        setupPassword: fromPromise<AuthSession, AccountFlowInput & { password: string }>(({ input }) =>
            setupAccountKeys(contextOf(input.auth), {
                addresses: input.auth.account.addresses,
                newPassword: input.password,
            })
        ),
        finalize: fromPromise<AuthSession, AccountFlowInput>(({ input }) =>
            finalizeSignIn(contextOf(input.auth), {
                user: input.auth.account.user,
                addresses: input.auth.account.addresses,
                loginPassword: input.auth.credentials.loginPassword,
            })
        ),
        unlockKeys: fromPromise<AuthSession, AccountFlowInput & { password: string; isOnePasswordMode: boolean }>(
            ({ input }) =>
                unlockAccountKeys(contextOf(input.auth), {
                    ...getUserAndSalts(input.auth),
                    addresses: input.auth.account.addresses,
                    loginPassword: input.auth.credentials.loginPassword,
                    clearKeyPassword: input.password,
                    isOnePasswordMode: input.isOnePasswordMode,
                })
        ),
    };
};

export type PasswordAccountActors = ReturnType<typeof createPasswordAccountActors>;
