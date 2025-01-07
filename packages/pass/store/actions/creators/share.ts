import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import type { SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import { type Share, type ShareAccessKeys } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const shareEditSync = createAction('share::edit:sync', (payload: { id: string; share: Share }) =>
    withCache({ payload })
);

export const shareDeleteSync = createAction('share::delete::sync', (share: Share) =>
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

export const sharesSync = createAction('shares::sync', (payload: SynchronizationResult) => withCache({ payload }));

export const shareAccessChange = createAction('share::access::change', (payload: Pick<Share, ShareAccessKeys>) =>
    withCache({ payload })
);
