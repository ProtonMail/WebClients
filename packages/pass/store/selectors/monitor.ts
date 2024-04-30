import { createSelector } from '@reduxjs/toolkit';

import { isActiveMonitored, isExcluded, itemEq } from '@proton/pass/lib/items/item.predicates';
import { intoSelectedItem } from '@proton/pass/lib/items/item.utils';
import { getDuplicatePasswords, intoAliasMonitorAddress } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType } from '@proton/pass/lib/monitor/types';
import type { State } from '@proton/pass/store/types';
import type { SelectedItem } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';

import { selectAliasItems, selectLoginItems } from './items';

export const selectMonitorState = (state: State) => state.monitor;
export const selectMonitoredLogins = createSelector(selectLoginItems, (items) => items.filter(isActiveMonitored));
export const selectExcludedLogins = createSelector(selectLoginItems, (items) => items.filter(isExcluded));
export const selectDuplicatePasswords = createSelector(selectMonitoredLogins, getDuplicatePasswords);
export const selectExcludedItems = createSelector(selectExcludedLogins, (items) => items.map(intoSelectedItem));

export const selectItemReport = (item: SelectedItem) =>
    createSelector(selectDuplicatePasswords, (duplicates) => ({
        password: { duplicates: duplicates.find((group) => group.some(itemEq(item))) ?? [] },
    }));

export const selectCustomBreaches = createSelector(selectMonitorState, (monitor) => monitor?.custom);
export const selectProtonBreaches = createSelector(selectMonitorState, (monitor) => monitor?.proton);
export const selectMonitorPreview = createSelector(selectMonitorState, (monitor) => first(monitor?.preview ?? []));
export const selectTotalBreaches = createSelector(selectMonitorState, (monitor) => monitor?.total);
export const selectHasCustomDomains = createSelector(selectMonitorState, (monitor) => monitor?.customDomains);

export const selectAliasBreaches = createSelector(selectAliasItems, (items) => items.map(intoAliasMonitorAddress));

export const selectMonitorSettings = ({ user }: State) => user.monitor;

export const selectMonitorSettingByType = (type: AddressType) =>
    createSelector(selectMonitorSettings, (settings) => {
        if (!settings) return false;
        switch (type) {
            case AddressType.ALIAS:
                return settings.Aliases;
            case AddressType.PROTON:
                return settings.ProtonAddress;
            default:
                return true;
        }
    });
