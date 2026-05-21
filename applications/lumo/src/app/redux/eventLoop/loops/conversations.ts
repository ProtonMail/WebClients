import { ActionEventV6 } from '@proton/shared/lib/api/events';

import { selectLocalIdFromRemote } from '../../selectors';
import { locallyDeleteConversationFromRemoteRequest, pullConversationRequest } from '../../slices/core/conversations';
import { pullSpacesRequest } from '../../slices/core/spaces';
import type { LumoEventLoopCallback } from '../interface';

const REFETCH_THRESHOLD = 6;

export const conversationsLoop: LumoEventLoopCallback = ({ event, state, dispatch }) => {
    const events = event.LumoConversations;
    if (!events?.length) {
        return;
    }

    if (events.length > REFETCH_THRESHOLD) {
        dispatch(pullSpacesRequest());
        return;
    }

    let needsFullSync = false;

    for (const { ID: remoteId, Action } of events) {
        const localId = selectLocalIdFromRemote('conversation', remoteId)(state);

        if (Action === ActionEventV6.Delete) {
            if (localId) {
                dispatch(locallyDeleteConversationFromRemoteRequest(localId));
            }
            continue;
        }

        if (localId) {
            dispatch(pullConversationRequest({ id: localId }));
        } else {
            needsFullSync = true;
            break;
        }
    }

    if (needsFullSync) {
        dispatch(pullSpacesRequest());
    }
};
