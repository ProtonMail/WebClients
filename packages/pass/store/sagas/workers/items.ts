import { api } from '@proton/pass/api';
import { PassCrypto } from '@proton/pass/crypto';
import type {
    AliasAndItemCreateRequest,
    CustomAliasCreateRequest,
    ImportItemBatchRequest,
    ImportItemRequest,
    ItemCreateIntent,
    ItemEditIntent,
    ItemImportIntent,
    ItemRevision,
    ItemRevisionContentsResponse,
    ItemType,
    Maybe,
} from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOpenedItem, serializeItemContent } from '@proton/pass/utils/protobuf';
import { getEpoch } from '@proton/pass/utils/time';

export const parseItemRevision = async (
    shareId: string,
    encryptedItem: ItemRevisionContentsResponse
): Promise<ItemRevision> => {
    const openedItem = await PassCrypto.openItem({ shareId, encryptedItem });
    return parseOpenedItem({ openedItem, shareId });
};

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

export const trashItem = (item: ItemRevision) =>
    api({
        url: `pass/v1/share/${item.shareId}/item/trash`,
        method: 'post',
        data: {
            Items: [
                {
                    ItemID: item.itemId,
                    Revision: item.revision,
                },
            ],
        },
    });

export const updateItemLastUseTime = async (shareId: string, itemId: string) =>
    (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/lastuse`,
            method: 'put',
            data: { LastUseTime: getEpoch() },
        })
    ).Revision!;

const requestAllItemsForShareId = async (shareId: string): Promise<ItemRevisionContentsResponse[]> => {
    const pageIterator = async (Since?: string): Promise<ItemRevisionContentsResponse[]> => {
        const { Items } = await api({
            url: `pass/v1/share/${shareId}/item`,
            method: 'get',
            params: Since ? { Since } : {},
        });

        return Items?.LastToken
            ? Items.RevisionsData.concat(await pageIterator(Items.LastToken))
            : Items!.RevisionsData;
    };

    return pageIterator();
};

export async function requestItemsForShareId(shareId: string): Promise<ItemRevision[]> {
    const items = await requestAllItemsForShareId(shareId);
    return Promise.all(items.map((encryptedItem) => parseItemRevision(shareId, encryptedItem)));
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
