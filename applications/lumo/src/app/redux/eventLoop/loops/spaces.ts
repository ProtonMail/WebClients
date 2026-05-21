import { ActionEventV6 } from '@proton/shared/lib/api/events';

import { selectLocalIdFromRemote } from '../../selectors';
import { locallyDeleteSpaceFromRemoteRequest, pullSpaceRequest, pullSpacesRequest } from '../../slices/core/spaces';
import type { LumoEventLoopCallback } from '../interface';

const REFETCH_THRESHOLD = 6;

export const spacesLoop: LumoEventLoopCallback = ({ event, state, dispatch }) => {
    const events = event.LumoSpaces;
    if (!events?.length) {
        return;
    }

    if (events.length > REFETCH_THRESHOLD) {
        dispatch(pullSpacesRequest());
        return;
    }

    let needsFullSync = false;

    for (const { ID: remoteId, Action } of events) {
        const localId = selectLocalIdFromRemote('space', remoteId)(state);

        if (Action === ActionEventV6.Delete) {
            if (localId) {
                dispatch(locallyDeleteSpaceFromRemoteRequest(localId));
            }
            continue;
        }

        if (localId) {
            dispatch(pullSpaceRequest({ id: localId }));
        } else {
            needsFullSync = true;
            break;
        }
    }

    if (needsFullSync) {
        dispatch(pullSpacesRequest());
    }
};
