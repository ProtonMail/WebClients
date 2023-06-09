import type { AnyAction } from 'redux';

import type { Share } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import { fullMerge, objectDelete, objectMap, partialMerge } from '@proton/pass/utils/object';

import {
    bootSuccess,
    serverEvent,
    shareDeleteSync,
    shareEditSync,
    sharesSync,
    syncSuccess,
    vaultCreationFailure,
    vaultCreationIntent,
    vaultCreationSuccess,
    vaultDeleteFailure,
    vaultDeleteIntent,
    vaultDeleteSuccess,
    vaultEditFailure,
    vaultEditIntent,
    vaultEditSuccess,
    vaultSetPrimaryFailure,
    vaultSetPrimaryIntent,
    vaultSetPrimarySuccess,
} from '../actions';
import { sanitizeWithCallbackAction } from '../actions/with-callback';
import withOptimistic from '../optimistic/with-optimistic';

export type SharesState = { [shareId: string]: Share };

/**
 * Share actions are optimistic but do not allow retries
 * as of now (no fail optimistic matcher defined)
 */
export const withOptimisticShares = withOptimistic<SharesState>(
    [
        {
            initiate: vaultCreationIntent.optimisticMatch,
            revert: [vaultCreationFailure.optimisticMatch, vaultCreationSuccess.optimisticMatch],
        },
        {
            initiate: vaultEditIntent.optimisticMatch,
            revert: vaultEditFailure.optimisticMatch,
            commit: vaultEditSuccess.optimisticMatch,
        },
        {
            initiate: vaultDeleteIntent.optimisticMatch,
            revert: vaultDeleteFailure.optimisticMatch,
            commit: vaultDeleteSuccess.optimisticMatch,
        },
        {
            initiate: vaultSetPrimaryIntent.optimisticMatch,
            revert: vaultSetPrimaryFailure.optimisticMatch,
            commit: vaultSetPrimarySuccess.optimisticMatch,
        },
    ],
    (state = {}, action: AnyAction) => {
        if (bootSuccess.match(action) && action.payload.sync?.shares !== undefined) {
            return action.payload.sync.shares;
        }

        if (syncSuccess.match(action)) {
            return action.payload.shares;
        }

        if (sharesSync.match(action)) {
            return fullMerge(state, action.payload.shares);
        }

        if (serverEvent.match(action) && state !== null && action.payload.event.type === 'share') {
            return partialMerge(state, {
                [action.payload.event.shareId]: { eventId: action.payload.event.Events.LatestEventID },
            });
        }

        if (vaultCreationIntent.match(action)) {
            const { id, content } = action.payload;

            return fullMerge(state, {
                [id]: {
                    shareId: id,
                    vaultId: id,
                    targetId: id,
                    content: content,
                    targetType: ShareType.Vault,
                    primary: false,
                    eventId: '',
                },
            });
        }

        if (vaultCreationSuccess.match(action)) {
            const { share } = action.payload;
            return fullMerge(state, { [share.shareId]: share });
        }

        if (vaultEditIntent.match(action)) {
            const { id, content } = action.payload;
            return partialMerge(state, { [id]: { content } });
        }

        if (shareEditSync.match(action)) {
            const { id, share } = action.payload;
            return fullMerge(state, { [id]: share });
        }

        if (vaultDeleteIntent.match(action)) {
            return objectDelete(state, action.payload.id);
        }

        if (shareDeleteSync.match(action)) {
            return objectDelete(state, action.payload.shareId);
        }

        if (vaultSetPrimaryIntent.match(action)) {
            return objectMap(state)((shareId, share) => ({ ...share, primary: shareId === action.payload.id }));
        }

        return state;
    },
    { sanitizeAction: sanitizeWithCallbackAction }
);

export default withOptimisticShares.reducer;
