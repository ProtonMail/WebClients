import { c } from 'ttag';

import { MAX_BATCH_ITEMS_PER_REQUEST } from '@proton/pass/constants';
import type { Draft } from '@proton/pass/store/reducers';
import type { ItemRevision, ItemSortFilter, ItemType, MaybeNull, UniqueItem } from '@proton/pass/types';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import { arrayInterpolate } from '@proton/pass/utils/array/interpolate';
import { UNIX_DAY, UNIX_MONTH, UNIX_WEEK } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import chunk from '@proton/utils/chunk';

import { isEditItemDraft } from './item.predicates';

export const getItemKey = ({ shareId, itemId, revision }: ItemRevision) => `${shareId}-${itemId}-${revision}`;

export const getItemActionId = (
    payload:
        | { optimisticId: string; itemId?: string; shareId: string }
        | { optimisticId?: string; itemId: string; shareId: string }
) => `${payload.shareId}-${payload?.optimisticId ?? payload.itemId!}`;

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
            return itemIds === undefined || itemIds.includes(draft.shareId);
        }

        return false;
    });

/** Converts an item revision to a revision request payload  */
export const mapToRevision = (item: ItemRevision) => ({ ItemID: item.itemId, Revision: item.revision });

/** Batches a list of items by shareId : each individual share batch
 * is in turn batched according to `MAX_BATCH_ITEMS_PER_REQUEST` */
export const batchByShareId = <T extends UniqueItem, R>(
    items: T[],
    mapTo: (item: T) => R
): { shareId: string; items: R[] }[] =>
    groupByKey(items, 'shareId').flatMap((shareTrashedItems) => {
        const batches = chunk(shareTrashedItems, MAX_BATCH_ITEMS_PER_REQUEST);
        return batches.map((batch) => ({
            shareId: batch[0].shareId,
            items: batch.map(mapTo),
        }));
    });
