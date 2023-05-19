import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ExtensionEndpoint, RecursivePartial } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';

import type { ProxiedSettings } from '../../reducers/settings';
import { settingsEdit } from '../requests';
import withCacheBlock from '../with-cache-block';
import withNotification from '../with-notification';
import withRequest from '../with-request';

export const settingEditIntent = createAction('setting update intent', (payload: RecursivePartial<ProxiedSettings>) =>
    pipe(withRequest({ type: 'start', id: settingsEdit('general') }), withCacheBlock)({ payload })
);

export const settingEditFailure = createAction(
    'settings edit failure',
    (error: unknown, receiver?: ExtensionEndpoint) =>
        pipe(
            withRequest({ type: 'failure', id: settingsEdit('general') }),
            withNotification({ type: 'error', text: c('Error').t`Settings update failed`, receiver, error }),
            withCacheBlock
        )({ payload: {} })
);

export const settingEditSuccess = createAction(
    'settings edit success',
    (payload: RecursivePartial<ProxiedSettings>, receiver?: ExtensionEndpoint) =>
        pipe(
            withNotification({ type: 'success', text: c('Info').t`Settings successfully updated`, receiver }),
            withRequest({ type: 'success', id: settingsEdit('general') })
        )({ payload })
);
