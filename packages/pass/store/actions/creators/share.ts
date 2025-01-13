import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import type { SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
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
