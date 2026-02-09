import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { SyncResult } from '@proton/pass/lib/events/types';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withShareDedupe } from '@proton/pass/store/actions/enhancers/dedupe';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import type { ShareDedupeState } from '@proton/pass/store/reducers/shares-dedupe';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { Share, ShareCreatedDTO, ShareId, ShareType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const shareEventUpdate = createAction('share::event::update', (payload: Share) => pipe(withCache, withShareDedupe)({ payload }));

export const shareCreated = createAction('share::created', (payload: ShareCreatedDTO) => pipe(withCache, withShareDedupe)({ payload }));
export const shareUpdated = createAction('share::updated', (payload: Share) => pipe(withCache, withShareDedupe)({ payload }));
export const shareDeleted = createAction('share::deleted', ({ shareId }: Share) =>
    pipe(withCache, withShareDedupe)({ payload: { shareId } })
);

export const sharesEventNew = createAction('shares::event::new', (payload: Omit<SyncResult, 'dedupe'>) =>
    pipe(withCache, withShareDedupe)({ payload })
);

export const sharesEventSync = createAction('shares::event::sync', (payload: Share) => pipe(withCache, withShareDedupe)({ payload }));

export const sharesVisibilityEdit = requestActionsFactory<
    { sharesToHide: ShareId[]; sharesToUnhide: ShareId[] },
    Record<ShareId, Share<ShareType.Vault>>
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
                withShareDedupe,
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

export const sharesDedupeUpdate = createAction('shares::dedupe::update', (payload: ShareDedupeState) => withCache({ payload }));
