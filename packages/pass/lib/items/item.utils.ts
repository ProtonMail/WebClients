import { c } from 'ttag';

import { PassCrypto } from '@proton/pass/lib/crypto';
import type {
    ItemRevision,
    ItemRevisionContentsResponse,
    ItemSortFilter,
    ItemType,
    MaybeNull,
} from '@proton/pass/types';
import { arrayInterpolate } from '@proton/pass/utils/array/interpolate';
import { UNIX_DAY, UNIX_MONTH, UNIX_WEEK } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

import { parseOpenedItem } from './item-proto.transformer';

export const parseItemRevision = async (
    shareId: string,
    encryptedItem: ItemRevisionContentsResponse
): Promise<ItemRevision> => {
    const openedItem = await PassCrypto.openItem({ shareId, encryptedItem });
    return parseOpenedItem({ openedItem, shareId });
};

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
                      { label: c('Label').t`Today`, boundary: now - UNIX_DAY },
                      { label: c('Label').t`Last week`, boundary: now - UNIX_WEEK },
                      { label: c('Label').t`Last 2 weeks`, boundary: now - UNIX_WEEK * 2 },
                      { label: c('Label').t`Last month`, boundary: now - UNIX_MONTH },
                  ]
                : [],
            fallbackCluster: { label: c('Label').t`Older than last month`, boundary: 0 },
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
