import { c } from 'ttag';

import type { Item, ItemRevision, UniqueItem } from '@proton/pass/types';

import { arrayInterpolate } from '../array';
import { UNIX_DAY, UNIX_MONTH, UNIX_WEEK, getEpoch } from '../time';

export const isLoginItem = (item: Item): item is Item<'login'> => item.type === 'login';
export const isAliasItem = (item: Item): item is Item<'alias'> => item.type === 'alias';
export const isNoteItem = (item: Item): item is Item<'note'> => item.type === 'note';

export const getItemKey = ({ shareId, itemId, revision }: ItemRevision) => `${shareId}-${itemId}-${revision}`;

export const getItemActionId = (
    payload:
        | { optimisticId: string; itemId?: string; shareId: string }
        | { optimisticId?: string; itemId: string; shareId: string }
) => `${payload.shareId}-${payload?.optimisticId ?? payload.itemId!}`;

export const itemEq =
    <T extends UniqueItem>(a: T) =>
    (b: T): boolean =>
        a.shareId === b.shareId && a.itemId === b.itemId;

export const belongsToShare =
    (shareId: string) =>
    <T extends UniqueItem>(item: T): boolean =>
        item.shareId === shareId;

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
            fallbackCluster: { label: c('Label').t`Not recently used`, boundary: 0 },
            shouldInterpolate: ({ lastUseTime, modifyTime }, { boundary }) =>
                Math.max(lastUseTime ?? modifyTime, modifyTime) > boundary,
        });
    };
