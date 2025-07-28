import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import type { ShareHiddenMap, ShareId, ShareType } from '@proton/pass/types';
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

export const sharesHide = requestActionsFactory<
    { hideMap: ShareHiddenMap },
    { shares: Record<ShareId, Share<ShareType.Vault>> }
>('shares::hide')({
    success: {
        prepare: (payload: { shares: Record<ShareId, Share<ShareType.Vault>> }) =>
            pipe(
                withCache,
                withNotification({
                    type: 'info',
                    text: c('Info').t`Vault organization successfully updated`,
                })
            )({ payload }),
    },
    failure: {
        prepare: (error: unknown, payload) =>
            withNotification({
                type: 'error',
                // FIXME (@ecandon): we could pass the number of failures here
                text: c('Error').t`Could not resolve share members`,
                error,
            })({ payload, error }),
    },
});
