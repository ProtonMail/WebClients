import { createSelector } from '@reduxjs/toolkit';

import { belongsToShares, isActiveMonitored, isExcluded } from '@proton/pass/lib/items/item.predicates';
import { intoSelectedItem } from '@proton/pass/lib/items/item.utils';
import { getDuplicatePasswords } from '@proton/pass/lib/monitor/monitor.utils';
import type { MonitorDomain } from '@proton/pass/lib/monitor/types';
import { AddressType } from '@proton/pass/lib/monitor/types';
import type { State } from '@proton/pass/store/types';
import type { Maybe, ShareId } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { and } from '@proton/pass/utils/fp/predicates';

import { selectVisibleLoginItems } from './items';

export const selectMonitorState = (state: State) => state.monitor;
export const selectMonitorSettings = ({ user }: State) => user.monitor;
export const selectTotalBreaches = (state: State) => state.monitor?.total;
export const selectHasCustomDomains = (state: State) => state.monitor?.customDomains;
export const selectCustomBreaches = (state: State) => state.monitor?.custom;
export const selectProtonBreaches = (state: State) => state.monitor?.proton;
export const selectMonitorPreview = (state: State): Maybe<MonitorDomain> => first(state.monitor?.preview ?? []);

export const selectMonitoredLogins = (shareIds?: ShareId[]) =>
    createSelector(selectVisibleLoginItems, (items) => items.filter(and(isActiveMonitored, belongsToShares(shareIds))));

export const selectDuplicatePasswords = (shareIds?: ShareId[]) => createSelector(selectMonitoredLogins(shareIds), getDuplicatePasswords);

export const selectExcludedItems = (shareIds?: ShareId[]) =>
    createSelector(selectVisibleLoginItems, (items) => items.filter(and(isExcluded, belongsToShares(shareIds))).map(intoSelectedItem));

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
