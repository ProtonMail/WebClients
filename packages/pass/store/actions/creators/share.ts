import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import type { ShareId, ShareType, ShareVisibilityMap } from '@proton/pass/types';
import { type Share, type ShareSyncKeys } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const shareEventUpdate = createAction('share::event::update', (payload: Share) => withCache({ payload }));
export const shareEventDelete = createAction('share::event::delete', (share: Share) =>
    pipe(
        withCache,
        withNotification({
            type: 'info',
            text: isVaultShare(share)
                ? c('Info').t`Vault "${share.content.name}" was removed`
                : c('Info').t`An item previously shared with you was removed`,
        })
    )({ payload: { shareId: share.shareId } })
);

export const sharesEventNew = createAction('shares::event::new', (payload: SynchronizationResult) =>
    withCache({ payload })
);

export const sharesEventSync = createAction('shares::event::sync', (payload: Pick<Share, ShareSyncKeys>) =>
    withCache({ payload })
);

export const sharesVisibilityEdit = requestActionsFactory<
    { visibilityMap: ShareVisibilityMap },
    { shares: Record<ShareId, Share<ShareType.Vault>> }
>('shares::visibility')({
    intent: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                text: c('Info').t`Updating vault organization...`,
                loading: true,
            })({ payload }),
    },
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'info',
                    text: c('Info').t`Vault organization successfully updated`,
                })
            )({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Info').t`Failed updating your vault organization`,
                error,
            })({ payload, error }),
    },
});
