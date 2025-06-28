import { MAX_MAX_BATCH_PER_REQUEST, MIN_MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { createPageIterator } from '@proton/pass/lib/api/utils';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { resolveItemKey } from '@proton/pass/lib/crypto/utils/helpers';
import type {
    AliasAndItemCreateRequest,
    BatchItemRevisionIDs,
    BatchItemRevisions,
    CustomAliasCreateRequest,
    EncodedItemKeyRotation,
    ImportItemBatchRequest,
    ImportItemRequest,
    ItemCreateIntent,
    ItemEditIntent,
    ItemImportIntent,
    ItemLatestKeyResponse,
    ItemMoveIndividualToShareRequest,
    ItemMoveMultipleToShareRequest,
    ItemRevision,
    ItemRevisionContentsResponse,
    ItemRevisionID,
    ItemRevisionsIntent,
    ItemType,
    ItemUpdateFlagsRequest,
    Maybe,
    SelectedItem,
    SelectedRevision,
    UniqueItem,
} from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { seq } from '@proton/pass/utils/fp/promises';
import { logId, logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import chunk from '@proton/utils/chunk';
import identity from '@proton/utils/identity';

import { serializeItemContent } from './item-proto.transformer';
import { parseItemRevision } from './item.parser';

export const getItemKeys = async (shareId: string, itemId: string): Promise<EncodedItemKeyRotation[]> => {
    const { Keys: result } = await api({ url: `pass/v1/share/${shareId}/item/${itemId}/key`, method: 'get' });
    return result.Keys;
};

/** Converts an item revision to a revision request payload  */
export const intoRevisionID = <T extends SelectedRevision>(item: T): ItemRevisionID => ({
    ItemID: item.itemId,
    Revision: item.revision,
});

/** Batches a list of items by shareId : each individual share
 * batch is in turn batched according to the provided `batchSize` */
export const batchByShareId = <T extends UniqueItem, R>(
    items: T[],
    mapTo: (item: T) => R,
    batchSize: number = MAX_MAX_BATCH_PER_REQUEST
): { shareId: string; items: R[] }[] =>
    groupByKey(items, 'shareId').flatMap((shareTrashedItems) => {
        const batches = chunk(shareTrashedItems, batchSize);
        return batches.map((batch) => ({
            shareId: batch[0].shareId,
            items: batch.map(mapTo),
        }));
    });

/* Item creation API request for all items
 * except for alias items */
export const createItem = async (createIntent: ItemCreateIntent<Exclude<ItemType, 'alias'>>): Promise<ItemRevision> => {
    const { shareId, files, ...item } = createIntent;

    const content = serializeItemContent(item);
    const data = await PassCrypto.createItem({ shareId, content });

    const { Item } = await api({
        url: `pass/v1/share/${shareId}/item`,
        method: 'post',
        data,
    });

    return parseItemRevision(shareId, Item);
};

/* Specific alias item API request */
export const createAlias = async (createIntent: ItemCreateIntent<'alias'>): Promise<ItemRevision<'alias'>> => {
    const { shareId, files, ...create } = createIntent;

    const content = serializeItemContent(create);
    const encryptedItem = await PassCrypto.createItem({ shareId, content });

    const data: CustomAliasCreateRequest = {
        Item: encryptedItem,
        Prefix: create.extraData.prefix,
        SignedSuffix: create.extraData.signedSuffix,
        MailboxIDs: create.extraData.mailboxes.map(({ id }) => id),
    };

    const { Item } = await api({
        url: `pass/v1/share/${shareId}/alias/custom`,
        method: 'post',
        data,
    });

    return parseItemRevision<'alias'>(shareId, Item);
};

export type ItemRevisionWithAlias = [ItemRevision<'login'>, ItemRevision<'alias'>];

/* Specific item with alias API request: the first item
 * returned will be the login item, followed by the alias */
export const createItemWithAlias = async (
    createIntent: ItemCreateIntent<'login'> & { extraData: { withAlias: true } }
): Promise<ItemRevisionWithAlias> => {
    const { shareId, files, ...item } = createIntent;

    const loginItemContent = serializeItemContent(item);
    const aliasItemContent = serializeItemContent(item.extraData.alias);

    const encryptedLoginItem = await PassCrypto.createItem({ shareId, content: loginItemContent });
    const encryptedAliasItem = await PassCrypto.createItem({ shareId, content: aliasItemContent });

    const data: AliasAndItemCreateRequest = {
        Item: encryptedLoginItem,
        Alias: {
            Prefix: item.extraData.alias.extraData.prefix,
            SignedSuffix: item.extraData.alias.extraData.signedSuffix,
            MailboxIDs: item.extraData.alias.extraData.mailboxes.map(({ id }) => id),
            Item: encryptedAliasItem,
        },
    };

    const { Bundle } = await api({
        url: `pass/v1/share/${shareId}/item/with_alias`,
        method: 'post',
        data,
    });

    const login = await parseItemRevision<'login'>(shareId, Bundle.Item);
    const alias = await parseItemRevision<'alias'>(shareId, Bundle.Alias);

    return [login, alias];
};

/** FIXME: we should start caching the item keys */
export const getLatestItemKey = async ({ shareId, itemId }: SelectedItem): Promise<ItemLatestKeyResponse> =>
    (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/key/latest`,
            method: 'get',
        })
    ).Key!;

export const editItem = async (editIntent: ItemEditIntent, lastRevision: number): Promise<ItemRevision> => {
    const { shareId, itemId, files, ...edit } = editIntent;
    const content = serializeItemContent(edit);
    const itemKey = await resolveItemKey(shareId, itemId);
    const data = await PassCrypto.updateItem({ content, lastRevision, itemKey });

    const { Item } = await api({ url: `pass/v1/share/${shareId}/item/${itemId}`, method: 'put', data });
    return parseItemRevision(shareId, Item);
};

/** Limit batch size to `MIN_MAX_BATCH_PER_REQUEST` to reduce and
 * use `seq` to limit concurrent requests. Each batch requires re-
 * fetching item keys during bulk move operations. */
export const moveItems = async (
    items: ItemRevision[],
    targetShareId: string,
    onBatch?: (
        data: BatchItemRevisions & { movedItems: ItemRevision[]; targetShareId: string },
        progress: number
    ) => void,
    progress: number = 0
): Promise<ItemRevision[]> => {
    const batches = batchByShareId(items, identity, MIN_MAX_BATCH_PER_REQUEST);

    const results = await seq(batches, async ({ shareId, items }) => {
        const data: ItemMoveMultipleToShareRequest = {
            ShareID: targetShareId,
            Items: await Promise.all(
                items.map<Promise<ItemMoveIndividualToShareRequest>>(async (item) => {
                    const encryptedItemKeys = await getItemKeys(shareId, item.itemId);

                    return PassCrypto.moveItem({
                        encryptedItemKeys,
                        itemId: item.itemId,
                        shareId,
                        targetShareId,
                    });
                })
            ),
        };

        const { Items = [] } = await api({
            url: `pass/v1/share/${shareId}/item/share`,
            method: 'put',
            data,
        });

        const movedItems = await Promise.all(Items.map(parseItemRevision.bind(null, targetShareId)));
        onBatch?.({ batch: items, movedItems, shareId, targetShareId }, (progress += movedItems.length));
        return movedItems;
    });

    return results.flat();
};

export const trashItems = async (
    items: SelectedRevision[],
    onBatch?: (data: BatchItemRevisionIDs, progress: number) => void,
    progress: number = 0
) =>
    (
        await Promise.all(
            batchByShareId(items, intoRevisionID).map(async ({ shareId, items: Items }) => {
                const response = await api({
                    url: `pass/v1/share/${shareId}/item/trash`,
                    method: 'post',
                    data: { Items },
                });

                onBatch?.({ shareId, batch: Items }, (progress += Items.length));
                return response;
            })
        )
    ).flatMap(({ Items }) => Items ?? []);

export const restoreItems = async (
    items: SelectedRevision[],
    onBatch?: (data: BatchItemRevisionIDs, progress: number) => void,
    progress: number = 0
) =>
    (
        await Promise.all(
            batchByShareId(items, intoRevisionID).map(async ({ shareId, items: Items }) => {
                const response = await api({
                    url: `pass/v1/share/${shareId}/item/untrash`,
                    method: 'post',
                    data: { Items },
                });

                onBatch?.({ shareId, batch: Items }, (progress += Items.length));
                return response;
            })
        )
    ).flatMap(({ Items }) => Items);

export const deleteItemRevisions = async ({ shareId, itemId }: SelectedItem): Promise<ItemRevision> => {
    const { Item } = await api({ url: `pass/v1/share/${shareId}/item/${itemId}/revisions`, method: 'delete' });
    return parseItemRevision(shareId, Item);
};

export const deleteItems = async (
    items: SelectedRevision[],
    onBatch?: (data: BatchItemRevisionIDs, progress: number) => void,
    progress: number = 0
) =>
    (
        await Promise.all(
            batchByShareId(items, intoRevisionID).map(async ({ shareId, items: Items }) => {
                await api({
                    url: `pass/v1/share/${shareId}/item`,
                    method: 'delete',
                    data: { Items },
                });

                onBatch?.({ shareId, batch: Items }, (progress += items.length));
                return Items;
            })
        )
    ).flat();

export const updateItemLastUseTime = async (shareId: string, itemId: string) =>
    (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/lastuse`,
            method: 'put',
            data: { LastUseTime: getEpoch() },
        })
    ).Revision;

export const requestAllItemsForShareId = async (
    options: { shareId: string; OnlyAlias?: boolean },
    onBatch?: (progress: number) => void
): Promise<ItemRevisionContentsResponse[]> =>
    createPageIterator({
        onBatch,
        request: async (Since) => {
            const { Items } = await api({
                url: `pass/v1/share/${options.shareId}/item`,
                method: 'get',
                params: Since ? { Since, OnlyAlias: options.OnlyAlias } : {},
            });

            return { data: Items?.RevisionsData ?? [], cursor: Items?.LastToken };
        },
    })();

/** Will not throw on decryption errors : this avoids blocking the
 *  user if one item is corrupted or is using a newer proto version */
export async function requestItemsForShareId(
    shareId: string,
    onBatch?: (progress: number) => void
): Promise<ItemRevision[]> {
    const encryptedItems = await requestAllItemsForShareId({ shareId }, onBatch);
    const items = await Promise.all(encryptedItems.map((item) => parseItemRevision(shareId, item).catch(() => null)));
    return items.filter(truthy);
}

export const importItemsBatch = async (options: {
    shareId: string;
    importIntents: ItemImportIntent[];
}): Promise<ItemRevision[]> => {
    const { shareId, importIntents } = options;
    const data: ImportItemBatchRequest = {
        Items: (
            await Promise.all(
                importIntents.map(async (importIntent): Promise<Maybe<ImportItemRequest>> => {
                    const { trashed, createTime, modifyTime, ...item } = importIntent;

                    try {
                        return {
                            Item: await PassCrypto.createItem({ shareId, content: serializeItemContent(item) }),
                            AliasEmail: item.type === 'alias' ? item.extraData.aliasEmail : null,
                            Trashed: trashed,
                            CreateTime: createTime ?? null,
                            ModifyTime: modifyTime ?? null,
                        };
                    } catch (e) {
                        logger.info(`[Import] could not import ${logId(item.metadata.itemUuid)}`);
                        return;
                    }
                })
            )
        ).filter(truthy),
    };

    if (data.Items.length === 0) return [];

    const result = await api({
        url: `pass/v1/share/${shareId}/item/import/batch`,
        method: 'post',
        data,
    });

    if (result.Revisions?.RevisionsData === undefined) {
        throw new Error(`Error while batch importing data`);
    }

    return Promise.all(result.Revisions.RevisionsData.map((revision) => parseItemRevision(shareId, revision)));
};

/** Update the item monitoring flag */
export const updateItemFlags = async (
    shareId: string,
    itemId: string,
    data: ItemUpdateFlagsRequest
): Promise<ItemRevisionContentsResponse> =>
    (await api({ url: `pass/v1/share/${shareId}/item/${itemId}/flags`, method: 'put', data })).Item!;

export const pinItem = (shareId: string, itemId: string) =>
    api({ url: `pass/v1/share/${shareId}/item/${itemId}/pin`, method: 'post' });

export const unpinItem = (shareId: string, itemId: string) =>
    api({ url: `pass/v1/share/${shareId}/item/${itemId}/pin`, method: 'delete' });

export const getItemRevisions = async (
    { shareId, itemId, pageSize, since }: ItemRevisionsIntent,
    signal?: AbortSignal
) => {
    return (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/revision`,
            params: { PageSize: pageSize, ...(since ? { Since: since } : {}) },
            method: 'get',
            signal,
        })
    ).Revisions;
};
