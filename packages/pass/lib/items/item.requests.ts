import { MAX_BATCH_ITEMS_PER_REQUEST } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import type {
    AliasAndItemCreateRequest,
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
    ItemType,
    Maybe,
} from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import chunk from '@proton/utils/chunk';

import { serializeItemContent } from './item-proto.transformer';
import { parseItemRevision } from './item.parser';

const batchRevisionsByShareId = (items: ItemRevision[]) =>
    groupByKey(items, 'shareId').flatMap((shareTrashedItems) => {
        const batches = chunk(shareTrashedItems, MAX_BATCH_ITEMS_PER_REQUEST);
        return batches.map((batch) => ({
            shareId: batch[0].shareId,
            Items: batch.map((item) => ({ ItemID: item.itemId, Revision: item.revision })),
        }));
    });

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

export const moveItems = async (items: ItemRevision[], destinationShareId: string): Promise<ItemRevision[]> => {
    const groupedByShareId = groupByKey(items, 'shareId').flatMap((shareItems) => {
        const batches = chunk(shareItems, MAX_BATCH_ITEMS_PER_REQUEST);
        return batches.map((batch) => ({
            shareId: batch[0].shareId,
            items: batch,
        }));
    });

    const encryptedItems = (
        await Promise.all(
            groupedByShareId.map(async (batch) => {
                const data: ItemMoveMultipleToShareRequest = {
                    ShareID: destinationShareId,
                    Items: await Promise.all(
                        batch.items.map<Promise<ItemMoveIndividualToShareRequest>>(async (item) => {
                            const content = serializeItemContent(item.data);

                            return {
                                ItemID: item.itemId,
                                Item: (await PassCrypto.moveItem({ destinationShareId, content })).Item,
                            };
                        })
                    ),
                };

                return (await api({ url: `pass/v1/share/${batch.shareId}/item/share`, method: 'put', data })).Items!;
            })
        )
    ).flat();

    const revisions = encryptedItems.map(async (encryptedItem) => parseItemRevision(destinationShareId, encryptedItem));
    return Promise.all(revisions);
};

export const trashItems = async (items: ItemRevision[]) =>
    (
        await Promise.all(
            batchRevisionsByShareId(items).map(({ shareId, Items }) =>
                api({
                    url: `pass/v1/share/${shareId}/item/trash`,
                    method: 'post',
                    data: { Items },
                })
            )
        )
    ).flatMap(({ Items }) => Items?.Items ?? []);

export const restoreItems = (items: ItemRevision[]) =>
    Promise.all(
        batchRevisionsByShareId(items).map(({ shareId, Items }) =>
            api({
                url: `pass/v1/share/${shareId}/item/untrash`,
                method: 'post',
                data: { Items },
            })
        )
    );

export const deleteItems = (items: ItemRevision[]) =>
    Promise.all(
        batchRevisionsByShareId(items).map(({ shareId, Items }) =>
            api({
                url: `pass/v1/share/${shareId}/item`,
                method: 'delete',
                data: { Items },
            })
        )
    );

export const updateItemLastUseTime = async (shareId: string, itemId: string) =>
    (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/lastuse`,
            method: 'put',
            data: { LastUseTime: getEpoch() },
        })
    ).Revision!;

const requestAllItemsForShareId = async (
    shareId: string,
    onItemsLoaded?: (total: number) => void
): Promise<ItemRevisionContentsResponse[]> => {
    const pageIterator = async (count: number, Since?: string): Promise<ItemRevisionContentsResponse[]> => {
        const { Items } = await api({
            url: `pass/v1/share/${shareId}/item`,
            method: 'get',
            params: Since ? { Since } : {},
        });

        const nextCount = count + (Items?.RevisionsData.length ?? 0);
        onItemsLoaded?.(nextCount);

        return Items?.LastToken
            ? Items.RevisionsData.concat(await pageIterator(nextCount, Items.LastToken))
            : Items!.RevisionsData;
    };

    return pageIterator(0);
};

/* avoid throwing when decrypting items for a shareId - this avoids blocking
 * the user if one item is corrupted or is using a newer proto version */
export async function requestItemsForShareId(
    shareId: string,
    onItemsLoaded?: (total: number) => void
): Promise<ItemRevision[]> {
    const encryptedItems = await requestAllItemsForShareId(shareId, onItemsLoaded);
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
                        logger.info(`[Saga::Import] could not import "${item.metadata.name}"`);
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
