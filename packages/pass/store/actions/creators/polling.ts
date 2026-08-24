import { createAction } from '@reduxjs/toolkit';

import type { AccessDTO } from '../../../lib/access/types';
import { AccessTarget } from '../../../lib/access/types';
import { SYNC_STRATEGY } from '../../../lib/sync/global';
import { SyncStrategy } from '../../../lib/sync/types';

export const forcePollV1 = createAction<string>('channel::poll::v1');
export const forcePollV2 = createAction('channel::poll::v2');
export const syncShares = () => forcePollV1('shares');
export const syncShare = (shareID: string) => forcePollV1(`share::${shareID}`);
export const refreshShareAccess = createAction<string>('share::access::refresh');

/** Refresh the access manager immediately after a sharing action instead of waiting
 * for the next scheduled poll.
 * - V2 (`USER_EVENTS`): re-fetch the affected share to update its `shared` flag
 * (the member list is refreshed separately in `useShareAccessOptionsPolling`).
 * - V1 (`LEGACY`): when target is vault: sync shares event route to get sharing data.
 * When target is item: sync share event route to get `UpdatedItems`. */
export const syncAccess = ({ target, shareId }: AccessDTO) => {
    if (SYNC_STRATEGY === SyncStrategy.USER_EVENTS) return refreshShareAccess(shareId);
    return target === AccessTarget.Vault ? syncShares() : syncShare(shareId);
};
