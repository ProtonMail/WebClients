import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { DelegatedAccessStateEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import { listIncomingDelegatedAccess } from './incomingActions';
import type { DelegatedAccessState } from './index';
import { listOutgoingDelegatedAccess } from './outgoingActions';

/**
 * @returns whether key generation should be blocked based on the delegated access statuses
 * (both outgoing and incoming)
 */
export const getHasAccountKeyChangeBlockingDelegatedAccess = (): ThunkAction<
    Promise<boolean>,
    DelegatedAccessState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [outgoingDelegatedAccesses, incomingDelegatedAccesses] = await Promise.all([
            dispatch(listOutgoingDelegatedAccess()),
            dispatch(listIncomingDelegatedAccess()),
        ]);
        const blockingOutgoingDelegatedAccesses = outgoingDelegatedAccesses.filter(
            // If the outgoing delegated access is in `Accessible` or `Recoverable` state, it means the recovery
            // process has been activated, and we prevent opt-in to avoid disrupting the recovery flows:
            // - if Accessible, we do not want to cut emergency access off; the user can do so manually if
            // they wish
            // - if Recoverable, we must not apply account key changes until the keys are re-activated
            (delegatedAccess) =>
                delegatedAccess.State === DelegatedAccessStateEnum.Accessible ||
                delegatedAccess.State === DelegatedAccessStateEnum.Recoverable
        );
        const blockingIncomingDelegatedAccesses = incomingDelegatedAccesses.filter(
            // Incoming delegated access should not be in `Recoverable` state, since account FE code should
            // already have taken care of finishing the recovery flow. Still, blocking that state just-in-case
            // is not disruptive.
            // For `Accessible` emergency access: we again prevent opt-in to avoid cutting off the access for the user.
            (delegatedAccess) =>
                delegatedAccess.State === DelegatedAccessStateEnum.Accessible ||
                delegatedAccess.State === DelegatedAccessStateEnum.Recoverable
        );
        return blockingIncomingDelegatedAccesses.length > 0 || blockingOutgoingDelegatedAccesses.length > 0;
    };
};
