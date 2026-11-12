import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useOptionalMonitor } from '../../components/Monitor/MonitorContext';
import { itemEq } from '../../lib/items/item.predicates';
import { intoSelectedItem } from '../../lib/items/item.utils';
import { type ItemMonitorCheckState, getVisibleItemMonitorChecks } from '../../lib/monitor/item-checks.utils';
import { MonitorCheckType } from '../../lib/monitor/types';
import { checkCompromisedPasswordForItem } from '../../store/actions/creators/monitor';
import {
    selectDuplicatePasswords,
    selectIsItemCompromisedCacheStale,
    selectIsItemCompromisedFromCache,
} from '../../store/selectors/monitor';
import { PassFeature } from '../../types/api/features';
import type { ItemRevision } from '../../types/data/items';
import { not } from '../../utils/fp/predicates';
import { useFeatureFlag } from '../useFeatureFlag';
import { useMemoSelector } from '../useMemoSelector';
import { useSingleItemMonitorAsyncChecks } from './useSingleItemMonitorAsyncChecks';

export const useItemMonitorChecks = (revision: ItemRevision, enabled = true) => {
    const dispatch = useDispatch();
    const item = useMemo(() => intoSelectedItem(revision), [revision]);
    const compromisedEnabled = useFeatureFlag(PassFeature.PassCompromisedPasswords);
    const monitorContext = useOptionalMonitor();

    const useProviderScans = enabled && monitorContext !== null;
    const runSingleItemScans = enabled && monitorContext === null;

    const singleItemScans = useSingleItemMonitorAsyncChecks(revision, runSingleItemScans);
    const compromisedFromCache = useMemoSelector(selectIsItemCompromisedFromCache, [revision]);
    const compromisedCacheStale = useMemoSelector(selectIsItemCompromisedCacheStale, [revision]);
    const duplicates = useMemoSelector(selectDuplicatePasswords, []);

    useEffect(() => {
        if (!enabled || !compromisedEnabled || !compromisedCacheStale) return;

        dispatch(
            checkCompromisedPasswordForItem({
                shareId: revision.shareId,
                itemId: revision.itemId,
            })
        );
    }, [
        compromisedCacheStale,
        compromisedEnabled,
        dispatch,
        enabled,
        revision.itemId,
        revision.revision,
        revision.shareId,
    ]);

    const duplicateMatches = useMemo(() => {
        const group = duplicates.find((group) => group.some(itemEq(item))) ?? [];
        return group.filter(not(itemEq(item)));
    }, [duplicates, item]);

    const failing = useMemo<ItemMonitorCheckState>(() => {
        const compromised = compromisedEnabled ? compromisedFromCache : false;

        if (useProviderScans) {
            return {
                [MonitorCheckType.WEAK]: monitorContext.insecure.data.some(itemEq(item)),
                [MonitorCheckType.REUSED]: duplicateMatches.length > 0,
                [MonitorCheckType.COMPROMISED]: compromised,
                [MonitorCheckType.MISSING_2FA]: monitorContext.missing2FAs.data.some(itemEq(item)),
            };
        }

        return {
            [MonitorCheckType.WEAK]: singleItemScans.weak,
            [MonitorCheckType.REUSED]: duplicateMatches.length > 0,
            [MonitorCheckType.COMPROMISED]: compromised,
            [MonitorCheckType.MISSING_2FA]: singleItemScans.missing2FA,
        };
    }, [
        compromisedEnabled,
        compromisedFromCache,
        duplicateMatches.length,
        item,
        monitorContext,
        singleItemScans.missing2FA,
        singleItemScans.weak,
        useProviderScans,
    ]);

    const loading = useMemo(() => {
        if (!enabled) return false;
        if (useProviderScans) {
            return (
                monitorContext.insecure.loading ||
                monitorContext.missing2FAs.loading ||
                monitorContext.compromised.loading
            );
        }
        return singleItemScans.loading;
    }, [enabled, monitorContext, singleItemScans.loading, useProviderScans]);

    return {
        compromisedEnabled,
        duplicateMatches,
        failing,
        item,
        loading,
    };
};

export const useVisibleItemMonitorChecks = (
    revision: ItemRevision,
    excludedView: boolean,
    checks: ReturnType<typeof useItemMonitorChecks>
) =>
    useMemo(
        () =>
            getVisibleItemMonitorChecks({
                compromisedEnabled: checks.compromisedEnabled,
                excludedView,
                failing: checks.failing,
                revision,
            }),
        [checks.compromisedEnabled, checks.failing, excludedView, revision]
    );
