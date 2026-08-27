import { createSelector } from '@reduxjs/toolkit';

import { belongsToShares, isActiveMonitored, isExcluded } from '../../lib/items/item.predicates';
import { getItemKey, intoSelectedItem } from '../../lib/items/item.utils';
import { getDuplicatePasswords } from '../../lib/monitor/monitor.utils';
import type { MonitorDomain } from '../../lib/monitor/types';
import { AddressType } from '../../lib/monitor/types';
import type { Maybe, ShareId } from '../../types';
import { first } from '../../utils/array/first';
import { and } from '../../utils/fp/predicates';
import type { State } from '../types';
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

export const selectCompromisedPasswordsCache = (state: State) => state.compromisedPasswords.items;
export const selectLastSyncedChange = (state: State) => state.compromisedPasswords.lastSyncedChange;
export const selectCompromisedPasswordsProgress = (state: State) => state.compromisedPasswords.progress;

export const selectCompromisedPasswords = (shareIds?: ShareId[]) =>
    createSelector([selectMonitoredLogins(shareIds), selectCompromisedPasswordsCache], (items, cache) =>
        items.filter((item) => item.data.content.password.v.length && cache[getItemKey(item)]?.compromised).map(intoSelectedItem)
    );

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
