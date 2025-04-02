import { c, msgid } from 'ttag';

import { MAX_MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import type { Draft } from '@proton/pass/store/reducers';
import type {
    BulkSelectionDTO,
    DeobfuscatedItem,
    IdentityItemPreview,
    ItemRevision,
    ItemRevisionID,
    ItemSortFilter,
    ItemType,
    LoginItem,
    LoginItemPreview,
    MaybeNull,
    SelectedItem,
    SelectedRevision,
    UniqueItem,
} from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { arrayInterpolate } from '@proton/pass/utils/array/interpolate';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { UNIX_DAY, UNIX_MONTH, UNIX_WEEK } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import chunk from '@proton/utils/chunk';

import { hasUserIdentifier, isEditItemDraft } from './item.predicates';

const SEPERATOR = '::';
const toKey = (...args: (string | number)[]) => args.join(SEPERATOR);

export const getItemRevisionKey = <T extends SelectedRevision>({ shareId, itemId, revision }: T) =>
    toKey(shareId, itemId, revision);

export const getItemKey = <T extends UniqueItem>({ shareId, itemId }: T) => toKey(shareId, itemId);

export const fromItemKey = (key: string): UniqueItem => {
    const [shareId, itemId] = key.split(SEPERATOR);
    return { itemId, shareId };
};

export const intoSelectedItem = ({ shareId, itemId }: ItemRevision): SelectedItem => ({ shareId, itemId });

export const getItemEntityID = (
    payload:
        | { optimisticId: string; itemId?: string; shareId: string }
        | { optimisticId?: string; itemId: string; shareId: string }
) => toKey(payload.shareId, payload?.optimisticId ?? payload.itemId!);

export const flattenItemsByShareId = (itemsByShareId: {
    [shareId: string]: { [itemId: string]: ItemRevision };
}): ItemRevision[] => Object.values(itemsByShareId).flatMap(Object.values);

export const interpolateRecentItems =
    <T extends ItemRevision>(items: T[]) =>
    (shouldInterpolate: boolean) => {
        type DateCluster = { label: string; boundary: number };
        const now = getEpoch();

        return arrayInterpolate<T, DateCluster>(items, {
            clusters: shouldInterpolate
                ? [
                      {
                          // translator: label means items that have been added or edited in last 24 hours from the current moment
                          label: c('Label').t`Today`,
                          boundary: now - UNIX_DAY,
                      },
                      {
                          // translator: label means items that have been added or edited in last 7 days from the current moment
                          label: c('Label').t`Last week`,
                          boundary: now - UNIX_WEEK,
                      },
                      {
                          // translator: label means items that have been added or edited in last 14 days from the current moment
                          label: c('Label').t`Last 2 weeks`,
                          boundary: now - UNIX_WEEK * 2,
                      },
                      {
                          // translator: label means items that have been added or edited in last 4 weeks from the current moment
                          label: c('Label').t`Last month`,
                          boundary: now - UNIX_MONTH,
                      },
                  ]
                : [],
            fallbackCluster: {
                // translator: label means items that have been added or edited more than a month ago (4 weeks) from the current moment
                label: c('Label').t`More than a month`,
                boundary: 0,
            },
            shouldInterpolate: ({ lastUseTime, modifyTime }, { boundary }) =>
                Math.max(lastUseTime ?? modifyTime, modifyTime) > boundary,
        });
    };

export const filterItemsByShareId =
    (shareId?: MaybeNull<string>) =>
    <T extends ItemRevision>(items: T[]) => {
        if (!shareId) return items;
        return items.filter((item) => shareId === item.shareId);
    };

export const filterItemsByType =
    (itemType?: MaybeNull<ItemType>) =>
    <T extends ItemRevision>(items: T[]) => {
        if (!itemType) return items;
        return items.filter((item) => !itemType || itemType === item.data.type);
    };

export const filterItemsByUserIdentifier = (email: string) => (items: LoginItem[]) =>
    items.reduce<LoginItem[]>((acc, item) => {
        if (hasUserIdentifier(email)(item)) acc.push(item);
        return acc;
    }, []);

export const sortItems =
    (sort?: MaybeNull<ItemSortFilter>) =>
    <T extends ItemRevision>(items: T[]) => {
        if (!sort) return items;

        return items.slice().sort((a, b) => {
            switch (sort) {
                case 'createTimeASC':
                    return a.createTime - b.createTime;
                case 'createTimeDESC':
                    return b.createTime - a.createTime;
                case 'recent':
                    return (
                        Math.max(b.lastUseTime ?? b.modifyTime, b.modifyTime) -
                        Math.max(a.lastUseTime ?? a.modifyTime, a.modifyTime)
                    );
                case 'titleASC':
                    return a.data.metadata.name.localeCompare(b.data.metadata.name);
            }
        });
    };

/** Filters the drafts for a given a shareId. If itemIds are provided it will
 * also try to match for these specifics items */
export const matchDraftsForShare = (drafts: Draft[], shareId: string, itemIds?: string[]) =>
    drafts.filter((draft) => {
        if (isEditItemDraft(draft) && draft.shareId === shareId) {
            return itemIds === undefined || itemIds.includes(draft.itemId);
        }

        return false;
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

/** Converts an item revision to a revision request payload  */
export const intoRevisionID = <T extends SelectedRevision>(item: T): ItemRevisionID => ({
    ItemID: item.itemId,
    Revision: item.revision,
});

/** Returns the username in priority if not empty, otherwise the email. This priority matters for autofill. */
export const intoUserIdentifier = (item: ItemRevision<'login'>): string =>
    deobfuscate(item.data.content.itemUsername) || deobfuscate(item.data.content.itemEmail);

export const intoLoginItemPreview = (item: ItemRevision<'login'>): LoginItemPreview => ({
    itemId: item.itemId,
    shareId: item.shareId,
    name: item.data.metadata.name,
    userIdentifier: intoUserIdentifier(item),
    url: item.data.content.urls?.[0],
});

export const intoIdentityItemPreview = (item: ItemRevision<'identity'>): IdentityItemPreview => ({
    itemId: item.itemId,
    shareId: item.shareId,
    name: item.data.metadata.name,
    fullName: item.data.content.fullName,
});

export const getSanitizedUserIdentifiers = ({
    itemEmail,
    itemUsername,
}: Pick<DeobfuscatedItem<'login'>['content'], 'itemEmail' | 'itemUsername'>) => {
    const validEmail = PassUI.is_email_valid(itemEmail);
    const emailUsername = PassUI.is_email_valid(itemUsername);

    if (itemUsername) {
        /* `itemEmail` is empty and `itemUsername` is a valid email: Move username to email field */
        if (!itemEmail && emailUsername) return { email: itemUsername, username: '' };
        /* `itemEmail` is invalid but `itemUsername` is a valid email: Swap email and username */
        if (!validEmail && emailUsername) return { email: itemUsername, username: itemEmail };
        /* All other cases, return in-place */
        return { email: itemEmail, username: itemUsername };
    }

    /* If `itemEmail` is valid, keep it; otherwise, move it to username field */
    return validEmail ? { email: itemEmail, username: '' } : { email: '', username: itemEmail };
};

export const intoBulkSelection = (items: UniqueItem[]): BulkSelectionDTO =>
    items.reduce<BulkSelectionDTO>((dto, { shareId, itemId }) => {
        dto[shareId] = dto[shareId] ?? {};
        dto[shareId][itemId] = true;
        return dto;
    }, {});

export const getBulkSelectionCount = (selected: BulkSelectionDTO) =>
    Object.values(selected).reduce((acc, items) => acc + Object.keys(items).length, 0);

export const formatDisplayNameWithEmail = (name: string, email: string) => `${name} <${email}>`;

export const formatItemsCount = (n: number) => c('Info').ngettext(msgid`${n} item`, `${n} items`, n);
