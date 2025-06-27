import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { getItemEntityID, getItemKey } from '@proton/pass/lib/items/item.utils';
import { withCache, withThrottledCache } from '@proton/pass/store/actions/enhancers/cache';
import { withSynchronousAction } from '@proton/pass/store/actions/enhancers/client';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    itemPinRequest,
    itemRevisionsRequest,
    itemUnpinRequest,
    itemsBulkDeleteRequest,
    itemsBulkMoveRequest,
    itemsBulkRestoreRequest,
    itemsBulkTrashRequest,
    selectedItemKey,
} from '@proton/pass/store/actions/requests';
import { createOptimisticAction } from '@proton/pass/store/optimistic/action/create-optimistic-action';
import type { Draft, DraftBase } from '@proton/pass/store/reducers';
import {
    withRequest,
    withRequestFailure,
    withRequestProgress,
    withRequestSuccess,
} from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type {
    BatchItemRevisionIDs,
    BatchItemRevisions,
    BulkSelectionDTO,
    ItemCreateIntent,
    ItemCreateSuccess,
    ItemEditIntent,
    ItemMoveDTO,
    ItemMoveIntent,
    ItemRevision,
    ItemRevisionsIntent,
    ItemRevisionsSuccess,
    OptimisticItem,
    SecureLink,
    SecureLinkCreationDTO,
    SecureLinkDeleteDTO,
    SecureLinkItem,
    SecureLinkQuery,
    SelectedItem,
    SelectedRevision,
    UniqueItem,
} from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const draftSave = createAction('draft::save', (payload: Draft) => withThrottledCache({ payload }));
export const draftDiscard = createAction('draft::discard', (payload: DraftBase) => withThrottledCache({ payload }));
export const draftsGarbageCollect = createAction('drafts::gc');

export const itemCreate = requestActionsFactory<ItemCreateIntent, ItemCreateSuccess, OptimisticItem>('item::create')({
    key: getItemEntityID,
    intent: { prepare: (payload) => withSynchronousAction({ payload }) },
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Item "${payload.item.data.metadata.name}" created`,
                })
            )({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Item creation failed`,
                error,
            })({ payload, error }),
    },
});

export const itemCreateDismiss = createOptimisticAction(
    'item::creation::dismiss',
    (payload: { optimisticId: string; shareId: string; itemName: string }) =>
        withNotification({
            type: 'info',
            text: c('Info').t`"${payload.itemName}" item was dismissed`,
        })({ payload }),
    ({ payload }) => getItemEntityID(payload)
);

export const itemEdit = requestActionsFactory<ItemEditIntent, { item: ItemRevision } & SelectedItem, SelectedItem>(
    'item::edit'
)({
    key: getItemEntityID,
    intent: { prepare: (payload) => withSynchronousAction({ payload }) },
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Item "${payload.item.data.metadata.name}" updated`,
                })
            )({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Editing item failed`,
                error,
            })({ payload, error }),
    },
});

export const itemEditDismiss = createOptimisticAction(
    'item::edit::dismiss',
    (payload: { itemId: string; shareId: string; itemName: string }) =>
        withNotification({
            type: 'info',
            text: c('Info').t`"${payload.itemName}" update was dismissed`,
        })({ payload }),
    ({ payload }) => getItemEntityID(payload)
);

export const itemsEditSync = createAction('items::edit::sync', (items: ItemRevision[]) =>
    withCache({ payload: { items } })
);

export const itemMove = requestActionsFactory<ItemMoveIntent, ItemMoveDTO>('item::move')({
    key: getItemKey<UniqueItem>,
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Moving item failed`,
                error,
            })({ payload, error }),
    },
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Item successfully moved`,
                })
            )({ payload }),
    },
});

export const itemBulkMoveIntent = createAction(
    'item::bulk::move::intent',
    (payload: { selected: BulkSelectionDTO; shareId: string }) =>
        pipe(
            withRequest({ status: 'start', id: itemsBulkMoveRequest(), data: payload.selected }),
            withNotification({
                expiration: -1,
                type: 'info',
                loading: true,
                text: c('Info').t`Moving items`,
            })
        )({ payload })
);

export const itemBulkMoveFailure = createAction(
    'item::bulk::move::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to move items`,
            error,
        })({ payload, error })
    )
);

export const itemBulkMoveProgress = createAction(
    'item::bulk::move::progress',
    withRequestProgress((payload: BatchItemRevisions & { movedItems: ItemRevision[]; targetShareId: string }) =>
        withCache({ payload })
    )
);

export const itemBulkMoveSuccess = createAction(
    'item::bulk::move::success',
    withRequestSuccess((payload: {}) =>
        withNotification({
            type: 'info',
            text: c('Info').t`All items successfully moved`,
        })({ payload })
    )
);

export const itemTrash = requestActionsFactory<SelectedRevision, SelectedRevision>('item::trash')({
    key: getItemKey,
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Item moved to trash`,
                })
            )({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Trashing item failed`,
                error,
            })({ payload, error }),
    },
});

export const itemBulkTrashIntent = createAction(
    'item::bulk::trash::intent',
    (payload: { selected: BulkSelectionDTO }) =>
        pipe(
            withRequest({ status: 'start', id: itemsBulkTrashRequest(), data: payload.selected }),
            withNotification({
                expiration: -1,
                type: 'info',
                loading: true,
                text: c('Info').t`Moving items to trash`,
            })
        )({ payload })
);

export const itemBulkTrashFailure = createAction(
    'item::bulk::trash::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to move items to trash`,
            error,
        })({ payload, error })
    )
);

export const itemBulkTrashProgress = createAction(
    'item::bulk::trash::progress',
    withRequestProgress((payload: BatchItemRevisionIDs) => withCache({ payload }))
);

export const itemBulkTrashSuccess = createAction(
    'item::bulk::trash::success',
    withRequestSuccess((payload: {}) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Selected items successfully moved to trash`,
        })({ payload })
    )
);

export const itemDelete = requestActionsFactory<SelectedItem, SelectedItem & { hadFiles: boolean }>('item::delete')({
    key: getItemKey,
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Deleting item failed`,
                error,
            })({ payload, error }),
    },
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Item permanently deleted`,
                })
            )({ payload }),
    },
});

export const itemDeleteRevisions = requestActionsFactory<SelectedItem, { item: ItemRevision } & SelectedItem>(
    'item::delete::revisions'
)({
    key: getItemKey,
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Deleting item history failed`,
                error,
            })({ payload, error }),
    },
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Item history permanently deleted`,
                })
            )({ payload }),
    },
});

export const itemBulkDeleteIntent = createAction(
    'item::bulk::delete::intent',
    (payload: { selected: BulkSelectionDTO }) =>
        pipe(
            withRequest({ status: 'start', id: itemsBulkDeleteRequest(), data: payload.selected }),
            withNotification({
                expiration: -1,
                type: 'info',
                loading: true,
                text: c('Info').t`Permanently deleting selected items`,
            })
        )({ payload })
);

export const itemBulkDeleteFailure = createAction(
    'item::bulk::delete::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to delete selected items`,
            error,
        })({ payload, error })
    )
);

export const itemBulkDeleteProgress = createAction(
    'item::bulk::delete::progress',
    withRequestProgress((payload: BatchItemRevisionIDs) => withCache({ payload }))
);

export const itemBulkDeleteSuccess = createAction(
    'item::bulk::delete::success',
    withRequestSuccess((payload: {}) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Selected items permanently deleted`,
        })({ payload })
    )
);

export const itemsDeleteSync = createAction('items::delete::sync', (shareId: string, itemIds: string[]) =>
    withCache({ payload: { shareId, itemIds } })
);

export const itemRestore = requestActionsFactory<SelectedItem, SelectedItem>('item::restore')({
    key: getItemKey,
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Restoring item failed`,
                error,
            })({ payload, error }),
    },
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Item restored`,
                })
            )({ payload }),
    },
});

export const itemBulkRestoreIntent = createAction(
    'item::bulk:restore::intent',
    (payload: { selected: BulkSelectionDTO }) =>
        pipe(
            withRequest({ status: 'start', id: itemsBulkRestoreRequest(), data: payload.selected }),
            withNotification({
                expiration: -1,
                type: 'info',
                loading: true,
                text: c('Info').t`Restoring items from trash`,
            })
        )({ payload })
);

export const itemBulkRestoreFailure = createAction(
    'item::bulk::restore::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to restore items from trash`,
            error,
        })({ payload, error })
    )
);

export const itemBulkRestoreProgress = createAction(
    'item::bulk::restore::progress',
    withRequestProgress((payload: BatchItemRevisionIDs) => withCache({ payload }))
);

export const itemBulkRestoreSuccess = createAction(
    'item::bulk::restore::success',
    withRequestSuccess((payload: {}) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Selected items successfully restored from trash`,
        })({ payload })
    )
);

export const itemAutofilled = createAction('item::autofilled', (payload: SelectedItem) => ({ payload }));

export const itemsUsedSync = createAction('items::used::sync', (items: (SelectedItem & { lastUseTime: number })[]) =>
    withCache({ payload: { items } })
);

export const itemPinIntent = createAction('item::pin::intent', (payload: UniqueItem) =>
    pipe(
        withRequest({ status: 'start', id: itemPinRequest(payload.shareId, payload.itemId) }),
        withNotification({
            type: 'info',
            text: c('Info').t`Pinning item...`,
            loading: true,
            expiration: -1,
        })
    )({ payload })
);

export const itemPinSuccess = createAction(
    'item::pin::success',
    withRequestSuccess((payload: UniqueItem) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Item successfully pinned`,
            })
        )({ payload })
    )
);

export const itemPinFailure = createAction(
    'item::pin::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to pin item`,
            error,
        })({ payload: {}, error })
    )
);

export const itemUnpinIntent = createAction('item::unpin::intent', (payload: UniqueItem) =>
    pipe(
        withRequest({ status: 'start', id: itemUnpinRequest(payload.shareId, payload.itemId) }),
        withNotification({
            type: 'info',
            text: c('Info').t`Unpinning item...`,
            loading: true,
            expiration: -1,
        })
    )({ payload })
);

export const itemUnpinSuccess = createAction(
    'item::unpin::success',
    withRequestSuccess((payload: UniqueItem) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Item successfully unpinned`,
            })
        )({ payload })
    )
);

export const itemUnpinFailure = createAction(
    'item::unpin::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to unpin item`,
            error,
        })({ payload: {}, error })
    )
);

export const itemHistoryIntent = createAction('item::history::intent', (payload: ItemRevisionsIntent) =>
    withRequest({ status: 'start', id: itemRevisionsRequest(payload.shareId, payload.itemId) })({ payload })
);

export const itemHistorySuccess = createAction(
    'item::history::success',
    withRequestSuccess((payload: ItemRevisionsSuccess) => ({ payload }))
);

export const itemHistoryFailure = createAction(
    'item::history::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to load item history`,
            error,
        })({ payload: {}, error })
    )
);

export const secureLinksGet = requestActionsFactory<void, SecureLink[]>('secure-link::get')({
    success: { config: { maxAge: UNIX_MINUTE, data: null } },
});

export const secureLinkCreate = requestActionsFactory<SecureLinkCreationDTO, SecureLink>('secure-link::create')({
    key: selectedItemKey,
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Secure link could not be created.`,
                error,
            })({ payload }),
    },
});

export const secureLinkOpen = requestActionsFactory<SecureLinkQuery, SecureLinkItem>('secure-link::open')({
    key: prop('token'),
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Secure link could not be opened.`,
                error,
            })({ payload, error: getErrorMessage(error) }),
    },
});

export const secureLinkRemove = requestActionsFactory<SecureLinkDeleteDTO, SecureLinkDeleteDTO>('secure-link::remove')({
    key: selectedItemKey,
    intent: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                loading: true,
                text: c('Info').t`Removing secure link...`,
            })({ payload }),
    },
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                text: c('Info').t`The secure link has been removed`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error')
                    .t`There was an error while removing the secure link. Please try again in a few minutes.`,
                error,
            })({ payload }),
    },
});

export const secureLinksRemoveInactive = requestActionsFactory<void, SecureLink[]>('secure-links::remove::inactive')({
    intent: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                loading: true,
                text: c('Info').t`Removing all inactive secure links...`,
            })({ payload }),
    },
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                text: c('Info').t`All inactive secure links were removed`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Inactive secure links could not be removed.`,
                error,
            })({ payload }),
    },
});
