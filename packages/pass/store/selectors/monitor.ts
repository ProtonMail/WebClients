import { createSelector } from '@reduxjs/toolkit';

import { isHealthCheckSkipped, itemEq } from '@proton/pass/lib/items/item.predicates';
import { getDuplicatePasswords } from '@proton/pass/lib/monitor/monitor.utils';
import type { SelectedItem, UniqueItem } from '@proton/pass/types';

import { selectLoginItems } from './items';

export const selectDuplicatePasswords = createSelector(selectLoginItems, getDuplicatePasswords);

export const selectExcludedItems = createSelector(selectLoginItems, (items): UniqueItem[] =>
    items.filter(isHealthCheckSkipped).map(({ shareId, itemId }) => ({ shareId, itemId }))
);

export const selectItemReport = (item: SelectedItem) =>
    createSelector(selectDuplicatePasswords, (duplicates) => ({
        password: { duplicates: duplicates.find((group) => group.some(itemEq(item))) ?? [] },
    }));
