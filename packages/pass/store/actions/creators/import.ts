import { createAction } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import type { ImportPayload, ImportProvider } from '@proton/pass/lib/import/types';
import { importItems } from '@proton/pass/store/actions/requests';
import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest from '@proton/pass/store/actions/with-request';
import type { ImportEntry } from '@proton/pass/store/reducers';
import type { ExtensionEndpoint, ItemRevision } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const importItemsIntent = createAction(
    'import items intent',
    (payload: { data: ImportPayload; provider: ImportProvider }) =>
        pipe(
            withCacheBlock,
            withRequest({
                id: importItems(),
                type: 'start',
            })
        )({ payload })
);

export const importItemsSuccess = createAction(
    'import items success',
    (payload: ImportEntry, endpoint?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withRequest({
                id: importItems(),
                type: 'success',
            }),
            withNotification({
                type: 'info',
                endpoint,
                text: c('Info').ngettext(
                    // translator: ${payload.total} is a number
                    msgid`Imported ${payload.total} item`,
                    `Imported ${payload.total} items`,
                    payload.total
                ),
            })
        )({ payload })
);

export const importItemsFailure = createAction('import items failure', (error: unknown, endpoint?: ExtensionEndpoint) =>
    pipe(
        withCacheBlock,
        withRequest({
            id: importItems(),
            type: 'failure',
        }),
        withNotification({
            type: 'error',
            endpoint,
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
