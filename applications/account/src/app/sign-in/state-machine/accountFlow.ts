/**
 * What the sign-in's two account flows share. After the first authentication the sign-in runs one of them as a child:
 * the password account flow (`passwordAccountStateMachine`) or the SSO account flow (`steps/sso/state-machine`).
 * Each shows its own screens, completes the sign-in itself, and ends with a result.
 */
import { PasswordError } from '@proton/shared/lib/authentication/error';
import type { OrganizationData } from '@proton/shared/lib/keys/unprivatization/helper';

import { errorOf, reportActorError } from './machineHelpers';
import type { SignInAuthState } from './signInAuthState';

/** How an account flow ends: signed in, back to the credentials form, or failed with an error to report. */
export type AccountFlowResult = { type: 'signedIn' } | { type: 'cancelled' } | { type: 'failed'; error: unknown };

/** No password rules (yet): a stable empty list, so selectors returning it don't re-render. */
export const NO_PASSWORD_POLICIES: OrganizationData['passwordPolicies'] = [];

export interface AccountFlowInput {
    auth: SignInAuthState;
}

/** A wrong password: stay on the screen (`target`) and report the error, so the user can retry. */
export const retryOnWrongPassword = (target: string) => ({
    guard: errorOf(PasswordError),
    target,
    actions: reportActorError,
});

/** Each account flow's `failed` final state has this id, so any of its states can end there. */
export const ACCOUNT_FLOW_FAILED = 'accountFlowFailed';

/** The flow can't continue: it ends as failed, and the sign-in reports the error and goes back to the form. */
export const failAccountFlow = {
    target: `#${ACCOUNT_FLOW_FAILED}`,
    actions: {
        type: 'setResult' as const,
        params: ({ event }: { event: { error: unknown } }) => ({
            result: { type: 'failed' as const, error: event.error },
        }),
    },
};
