import { api } from '@proton/pass/lib/api/api';
import { createPageIterator } from '@proton/pass/lib/api/utils';
import { PassCrypto } from '@proton/pass/lib/crypto';
import type {
    AliasAndItemCreateRequest,
    BatchItemRevisionIDs,
    BatchItemRevisions,
    CustomAliasCreateRequest,
    ImportItemBatchRequest,
    ImportItemRequest,
    ItemCreateIntent,
    ItemEditIntent,
    ItemImportIntent,
    ItemMoveIndividualToShareRequest,
    ItemMoveMultipleToShareRequest,
    ItemRevision,
    ItemRevisionContentsResponse,
    ItemRevisionsIntent,
    ItemType,
    ItemUpdateFlagsRequest,
    Maybe,
} from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import identity from '@proton/utils/identity';

import { serializeItemContent } from './item-proto.transformer';
import { parseItemRevision } from './item.parser';
import { batchByShareId, intoRevisionID } from './item.utils';

/* Item creation API request for all items
 * except for alias items */
export const createItem = async (
    createIntent: ItemCreateIntent<Exclude<ItemType, 'alias'>>
): Promise<ItemRevisionContentsResponse> => {
    const { shareId, ...item } = createIntent;

    const content = serializeItemContent(item);
    const data = await PassCrypto.createItem({ shareId, content });

    const { Item } = await api({
        url: `pass/v1/share/${shareId}/item`,
        method: 'post',
        data,
    });

    return Item!;
};

/* Specific alias item API request */
export const createAlias = async (createIntent: ItemCreateIntent<'alias'>): Promise<ItemRevisionContentsResponse> => {
    const { shareId, ...item } = createIntent;

    const content = serializeItemContent(item);
    const encryptedItem = await PassCrypto.createItem({ shareId, content });

    const data: CustomAliasCreateRequest = {
        Item: encryptedItem,
        Prefix: item.extraData.prefix,
        SignedSuffix: item.extraData.signedSuffix,
        MailboxIDs: item.extraData.mailboxes.map(({ id }) => id),
    };

    const { Item } = await api({
        url: `pass/v1/share/${shareId}/alias/custom`,
        method: 'post',
        data,
    });

    return Item!;
};

/* Specific item with alias API request: the first item
 * returned will be the login item, followed by the alias */
export const createItemWithAlias = async (
    createIntent: ItemCreateIntent<'login'> & { extraData: { withAlias: true } }
): Promise<[ItemRevisionContentsResponse, ItemRevisionContentsResponse]> => {
    const { shareId, ...item } = createIntent;

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

    return [Bundle!.Item, Bundle!.Alias];
};

export const editItem = async (
    editIntent: ItemEditIntent,
    lastRevision: number
): Promise<ItemRevisionContentsResponse> => {
    const { shareId, itemId, ...item } = editIntent;
    const content = serializeItemContent(item);

    const latestItemKey = (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/key/latest`,
            method: 'get',
        })
    ).Key!;

    const data = await PassCrypto.updateItem({ shareId, content, lastRevision, latestItemKey });

    const { Item } = await api({
        url: `pass/v1/share/${shareId}/item/${itemId}`,
        method: 'put',
        data,
    });

    return Item!;
};

export const moveItem = async (
    item: ItemRevision,
    shareId: string,
    destinationShareId: string
): Promise<ItemRevision> => {
    const content = serializeItemContent(item.data);
    const data = await PassCrypto.moveItem({ destinationShareId, content });

    const encryptedItem = (
        await api({
            url: `pass/v1/share/${shareId}/item/${item.itemId}/share`,
            method: 'put',
            data,
        })
    ).Item!;

    return parseItemRevision(destinationShareId, encryptedItem);
};

export const moveItems = async (
    items: ItemRevision[],
    destinationShareId: string,
    onBatch?: (
        data: BatchItemRevisions & { movedItems: ItemRevision[]; destinationShareId: string },
        progress: number
    ) => void,
    progress: number = 0
): Promise<ItemRevision[]> =>
    (
        await Promise.all(
            batchByShareId(items, identity).map(async ({ shareId, items }) => {
                const data: ItemMoveMultipleToShareRequest = {
                    ShareID: destinationShareId,
                    Items: await Promise.all(
                        items.map<Promise<ItemMoveIndividualToShareRequest>>(async (item) => {
                            const content = serializeItemContent(item.data);

                            return {
                                ItemID: item.itemId,
                                Item: (await PassCrypto.moveItem({ destinationShareId, content })).Item,
                            };
                        })
                    ),
                };

                const { Items = [] } = await api({ url: `pass/v1/share/${shareId}/item/share`, method: 'put', data });
                const decryptedItems = Items!.map((encrypted) => parseItemRevision(destinationShareId, encrypted));
                const movedItems = await Promise.all(decryptedItems);

                onBatch?.({ batch: items, movedItems, shareId, destinationShareId }, (progress += movedItems.length));
                return movedItems;
            })
        )
    ).flat();

export const trashItems = async (
    items: ItemRevision[],
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
    items: ItemRevision[],
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
    ).flatMap(({ Items }) => Items ?? []);

export const deleteItems = async (
    items: ItemRevision[],
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
    ).Revision!;

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
    onSkippedItem?: (skipped: ItemImportIntent) => void;
}): Promise<ItemRevisionContentsResponse[]> => {
    const { shareId, importIntents, onSkippedItem } = options;
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
                        logger.info(`[Import] could not import "${item.metadata.name}"`);
                        onSkippedItem?.(importIntent);
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

    return result.Revisions.RevisionsData;
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
    ).Revisions!;
};
