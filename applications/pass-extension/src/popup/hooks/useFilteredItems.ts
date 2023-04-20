import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type State, selectMatchItems } from '@proton/pass/store';
import type { ItemRevisionWithOptimistic } from '@proton/pass/types';
import identity from '@proton/utils/identity';

import { matchItem } from '../../shared/items';
import type { ItemsFilteringContextType } from '../context/items/ItemsFilteringContext';

const filterBy =
    <T extends any[]>(predicate: (el: T[0]) => boolean) =>
    (arr: T) =>
        arr.filter(predicate as any);

export const useFilteredItems = ({ search, sort, filter, shareId }: ItemsFilteringContextType) => {
    const activeMatchOptions = useMemo(
        () => ({ shareId: shareId ?? undefined, needle: search, matchItem, sort }),
        [search, shareId, sort]
    );
    const matched = useSelector((state: State) => selectMatchItems(state, activeMatchOptions));

    const trashMatchOptions = useMemo(() => ({ needle: search, matchItem, trash: true }), [search]);
    const trash = useSelector((state: State) => selectMatchItems(state, trashMatchOptions));

    const filteredItems = useMemo<ItemRevisionWithOptimistic[]>(() => {
        const filterByType = filter === '*' ? identity : filterBy((item) => item.data.type === filter);
        return filterByType(matched.result);
    }, [filter, matched.result]);

    return {
        trash,
        items: {
            result: filteredItems /* results after type filtering - sorted */,
            matched: matched.result /* results before type filtering pass - unsorted */,
            count: filteredItems.length /* filtered results count */,
            totalCount: matched.totalCount /* total number of items in selected|all share(s) */,
        },
    };
};
