import { createSelector } from '@reduxjs/toolkit';

import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { getDuplicatePasswords } from '@proton/pass/lib/monitor/monitor.utils';
import type { MonitorSummary } from '@proton/pass/lib/monitor/types';
import type { State } from '@proton/pass/store/types';
import type { SelectedItem } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

import { selectItems, selectItemsByType } from './items';

export const selectSentinelEnabled = ({ user }: State) => Boolean(user.userSettings?.HighSecurity.Value ?? false);

export const selectDuplicatePasswords = createSelector(selectItemsByType('login'), getDuplicatePasswords);

export const selectDuplicatePasswordItems = createSelector(selectDuplicatePasswords, selectItems, (duplicates, items) =>
    duplicates.map((group) => group.map(({ shareId, itemId }) => items[shareId][itemId]).filter(truthy))
);

export const selectItemReport = (item: SelectedItem) =>
    createSelector(selectDuplicatePasswords, (duplicates) => ({
        password: { duplicates: duplicates.find((group) => group.some(itemEq(item))) ?? [] },
    }));

export const selectMonitorSummary = createSelector(
    selectDuplicatePasswords,
    (duplicatePasswords): MonitorSummary => ({
        enabled: true,
        breaches: 2,
        duplicatePasswords: duplicatePasswords.length,
        weakPasswords: 10,
        missing2FAs: 3,
    })
);
