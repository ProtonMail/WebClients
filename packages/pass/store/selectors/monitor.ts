import { createSelector } from '@reduxjs/toolkit';

import { isActiveMonitored, isExcluded, isItemType } from '@proton/pass/lib/items/item.predicates';
import { intoSelectedItem } from '@proton/pass/lib/items/item.utils';
import { getDuplicatePasswords } from '@proton/pass/lib/monitor/monitor.utils';
import type { MonitorDomain } from '@proton/pass/lib/monitor/types';
import { AddressType } from '@proton/pass/lib/monitor/types';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';

import { selectItems, selectLoginItems } from './items';
import { selectOwnedVaults } from './shares';

export const selectMonitorState = (state: State) => state.monitor;
export const selectMonitorSettings = ({ user }: State) => user.monitor;
export const selectTotalBreaches = (state: State) => state.monitor?.total;
export const selectHasCustomDomains = (state: State) => state.monitor?.customDomains;
export const selectCustomBreaches = (state: State) => state.monitor?.custom;
export const selectProtonBreaches = (state: State) => state.monitor?.proton;
export const selectMonitorPreview = (state: State): Maybe<MonitorDomain> => first(state.monitor?.preview ?? []);

const selectOwnLoginItems = createSelector([selectOwnedVaults, selectItems], (ownedVaults, itemsByShareId) => {
    const ownItems = ownedVaults.flatMap(({ shareId }) => Object.values(itemsByShareId[shareId]));
    const ownLogins = ownItems.filter(isItemType('login'));
    return ownLogins;
});

export const selectMonitoredLogins = createSelector(selectLoginItems, (items) => items.filter(isActiveMonitored));
export const selectOwnMonitoredLogins = createSelector(selectOwnLoginItems, (items) => items.filter(isActiveMonitored));

export const selectDuplicatePasswords = createSelector(selectMonitoredLogins, getDuplicatePasswords);
export const selectOwnDuplicatePasswords = createSelector(selectOwnMonitoredLogins, getDuplicatePasswords);

export const selectExcludedItems = createSelector(selectLoginItems, (items) =>
    items.filter(isExcluded).map(intoSelectedItem)
);
export const selectOwnExcludedItems = createSelector(selectOwnLoginItems, (items) =>
    items.filter(isExcluded).map(intoSelectedItem)
);

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
