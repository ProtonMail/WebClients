import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { isGroupShare, isItemShare, isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withShareDedupe } from '@proton/pass/store/actions/enhancers/dedupe';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import type { ShareDedupeState } from '@proton/pass/store/reducers/shares-dedupe';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import type { Share, ShareId, ShareType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import identity from '@proton/utils/identity';

export const shareEventUpdate = createAction('share::event::update', (payload: Share) => pipe(withCache, withShareDedupe)({ payload }));
export const shareEventDelete = createAction('share::event::delete', (share: Share) =>
    pipe(
        withCache,
        withShareDedupe,
        withNotification({
            type: 'info',
            text: isVaultShare(share)
                ? c('Info').t`Vault "${share.content.name}" was removed`
                : c('Info').t`An item previously shared with you was removed`,
        })
    )({ payload: { shareId: share.shareId } })
);

export const sharesEventNew = createAction('shares::event::new', (payload: SynchronizationResult) => {
    const newGroupShares = Object.values(payload.shares).filter((share) => isGroupShare(share));
    const newGroupSharesCount = newGroupShares.length;
    const useGenericMessage = newGroupSharesCount > 1 || (newGroupShares[0] && isItemShare(newGroupShares[0]));
    const maybeVaultName = newGroupShares[0] && isVaultShare(newGroupShares[0]) && newGroupShares[0].content.name;

    return pipe(
        withCache,
        withShareDedupe,
        newGroupSharesCount === 0
            ? identity
            : withNotification({
                  type: 'info',
                  text: useGenericMessage
                      ? c('Info').t`${newGroupSharesCount} new shares have been shared with a group you are member of`
                      : c('Info').t`${maybeVaultName} has been shared with a group you are member of`,
              })
    )({ payload });
});

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
