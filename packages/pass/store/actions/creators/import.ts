import { createAction } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import { type ImportPayload, ImportProvider } from '@proton/pass/import';
import type { ExtensionEndpoint, ItemRevision } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';

import * as requests from '../requests';
import withCacheBlock from '../with-cache-block';
import withNotification from '../with-notification';
import withReceiver from '../with-receiver';
import withRequest from '../with-request';

export const importItemsIntent = createAction(
    'import items intent',
    (payload: { data: ImportPayload; provider: ImportProvider }, endpoint?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withReceiver({ receiver: endpoint }),
            withRequest({
                id: requests.importItems(),
                type: 'start',
            })
        )({ payload })
);

export const importItemsSuccess = createAction(
    'import items success',
    (payload: { total: number; ignored: string[]; provider: ImportProvider }, target?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withRequest({
                id: requests.importItems(),
                type: 'success',
            }),
            withNotification({
                type: 'info',
                target,
                text: c('Info').ngettext(
                    msgid`Imported ${payload.total} item`,
                    `Imported ${payload.total} items`,
                    payload.total
                ),
            })
        )({ payload })
);

export const importItemsFailure = createAction('import items failure', (error: unknown, target?: ExtensionEndpoint) =>
    pipe(
        withCacheBlock,
        withRequest({
            id: requests.importItems(),
            type: 'failure',
        }),
        withNotification({
            type: 'error',
            target,
            expiration: -1,
            text: c('Error').t`Importing items failed`,
            error,
        })
    )({ payload: {}, error })
);

export const itemsBatchImported = createAction(
    'item batch imported',
    (payload: { shareId: string; items: ItemRevision[] }) => withCacheBlock({ payload })
);
