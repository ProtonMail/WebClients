import { createSelector } from '@reduxjs/toolkit';

import {
    belongsToShares,
    hasAnyExclusion,
    isActive,
    isActiveMonitored,
    isEligibleForMonitorCheck,
    isExcluded,
} from '../../lib/items/item.predicates';
import { getItemKey, intoSelectedItem } from '../../lib/items/item.utils';
import { getDuplicatePasswords } from '../../lib/monitor/monitor.utils';
import type { MonitorDomain } from '../../lib/monitor/types';
import { AddressType, MonitorCheckType } from '../../lib/monitor/types';
import { PassFeature } from '../../types/api/features';
import type { ShareId } from '../../types/crypto/pass-types';
import type { ItemRevision } from '../../types/data/items';
import type { Maybe, MaybeNull } from '../../types/utils';
import { first } from '../../utils/array/first';
import { and } from '../../utils/fp/predicates';
import type { State } from '../types';
import { selectVisibleLoginItems } from './items';
import { selectFeatureFlag } from './user';

export const selectMonitorState = (state: State) => state.monitor;
export const selectMonitorSettings = ({ user }: State) => user.monitor;
export const selectCanCheckCompromisedPasswords = ({ user }: State) => user.plan?.MonitorCompromisedPasswords ?? false;
export const selectCanUseDarkWebMonitoring = ({ user }: State) => user.plan?.MonitorDarkWeb ?? false;
export const selectCanCheckDuplicatePasswords = ({ user }: State) => user.plan?.MonitorDeduplication ?? false;
export const selectTotalBreaches = (state: State) => state.monitor?.total;
export const selectHasCustomDomains = (state: State) => state.monitor?.customDomains;
export const selectCustomBreaches = (state: State) => state.monitor?.custom;
export const selectProtonBreaches = (state: State) => state.monitor?.proton;
export const selectMonitorPreview = (state: State): Maybe<MonitorDomain> => first(state.monitor?.preview ?? []);

export const selectMonitoredLogins = (shareIds?: ShareId[]) =>
    createSelector(selectVisibleLoginItems, (items) => items.filter(and(isActiveMonitored, belongsToShares(shareIds))));

export const selectLoginsEligibleForMonitorCheck = (checkType: MonitorCheckType, shareIds?: ShareId[]) =>
    createSelector(
        [selectVisibleLoginItems, selectFeatureFlag(PassFeature.PassMonitorPerCheckExclusion)],
        (items, perCheckExclusionEnabled) =>
            items.filter(
                and(belongsToShares(shareIds), perCheckExclusionEnabled ? isEligibleForMonitorCheck(checkType) : isActiveMonitored)
            )
    );

export const selectDuplicatePasswords = (shareIds?: ShareId[]) =>
    createSelector(selectLoginsEligibleForMonitorCheck(MonitorCheckType.REUSED, shareIds), getDuplicatePasswords);

export const selectCompromisedPasswordsCache = (state: State) => state.compromisedPasswords.items;
export const selectLastSyncedChange = (state: State) => state.compromisedPasswords.lastSyncedChange;
export const selectCompromisedPasswordsProgress = (state: State) => state.compromisedPasswords.progress;

export const selectCompromisedPasswords = (shareIds?: ShareId[]) =>
    createSelector(
        [selectLoginsEligibleForMonitorCheck(MonitorCheckType.COMPROMISED, shareIds), selectCompromisedPasswordsCache],
        (items, cache) =>
            items.filter((item) => item.data.content.password.v.length && cache[getItemKey(item)]?.compromised).map(intoSelectedItem)
    );

/** Resolves to `null` until the compromised-passwords check is both
 * feature-flagged on and has synced at least once : distinguishes
 * "not available" from "available, 0 compromised passwords found". */
export const selectCompromisedPasswordsReportCount = (shareIds?: ShareId[]) =>
    createSelector(
        [selectFeatureFlag(PassFeature.PassCompromisedPasswords), selectLastSyncedChange, selectCompromisedPasswords(shareIds)],
        (enabled, lastSyncedChange, compromised): MaybeNull<number> => (enabled && lastSyncedChange > 0 ? compromised.length : null)
    );

const selectIsItemCompromisedEligible = (revision: ItemRevision) =>
    createSelector(
        [selectFeatureFlag(PassFeature.PassMonitorPerCheckExclusion), (_state: State) => revision],
        (perCheckExclusionEnabled, item) => {
            if (item.data.type !== 'login') return false;
            if (!item.data.content.password.v.length) return false;

            return perCheckExclusionEnabled ? isEligibleForMonitorCheck(MonitorCheckType.COMPROMISED)(item) : isActiveMonitored(item);
        }
    );

export const selectIsItemCompromisedCacheStale = (revision: ItemRevision) =>
    createSelector(
        [selectCompromisedPasswordsCache, selectIsItemCompromisedEligible(revision), (_state: State) => revision],
        (cache, eligible, item) => {
            if (!eligible) return false;

            const entry = cache[getItemKey(item)];
            return entry?.revision !== item.revision;
        }
    );

export const selectIsItemCompromisedFromCache = (revision: ItemRevision) =>
    createSelector(
        [selectCompromisedPasswordsCache, selectIsItemCompromisedEligible(revision), (_state: State) => revision],
        (cache, eligible, item) => {
            if (!eligible) return false;

            const entry = cache[getItemKey(item)];
            return entry?.revision === item.revision && entry.compromised === true;
        }
    );

export const selectExcludedItems = (shareIds?: ShareId[]) =>
    createSelector(
        [selectVisibleLoginItems, selectFeatureFlag(PassFeature.PassMonitorPerCheckExclusion)],
        (items, perCheckExclusionEnabled) =>
            items
                .filter(and(belongsToShares(shareIds), perCheckExclusionEnabled ? and(isActive, hasAnyExclusion) : isExcluded))
                .map(intoSelectedItem)
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
