import { createSelector } from '@reduxjs/toolkit';

import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { getDuplicatePasswords } from '@proton/pass/lib/monitor/monitor.utils';
import type { State } from '@proton/pass/store/types';
import type { SelectedItem } from '@proton/pass/types';

import { selectLoginItems } from './items';

export const selectSentinelEnabled = ({ user }: State) => Boolean(user.userSettings?.HighSecurity.Value ?? false);

export const selectDuplicatePasswords = createSelector(selectLoginItems, getDuplicatePasswords);

export const selectItemReport = (item: SelectedItem) =>
    createSelector(selectDuplicatePasswords, (duplicates) => ({
        password: { duplicates: duplicates.find((group) => group.some(itemEq(item))) ?? [] },
    }));
