import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { Share } from '@proton/pass/types';
import { isVaultShare } from '@proton/pass/utils/pass/share';

import type { SynchronizationResult } from '../../sagas/workers/sync';
import withNotification from '../with-notification';

export const shareEditSync = createAction('share edit sync', (payload: { id: string; share: Share }) => ({ payload }));

export const shareDeleteSync = createAction('share delete sync', (share: Share) =>
    withNotification({
        type: 'info',
        text: isVaultShare(share)
            ? c('Info').t`Vault "${share.content.name}" was disabled`
            : c('Info').t`An item previously shared with you was disabled`,
    })({ payload: { shareId: share.shareId } })
);

export const sharesSync = createAction('new shares sync', (payload: SynchronizationResult) => ({ payload }));
