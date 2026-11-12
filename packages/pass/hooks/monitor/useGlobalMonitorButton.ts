import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import type { IconName } from '@proton/icons/types';

import { useItemScope } from '../../components/Navigation/NavigationMatches';
import { isMonitored } from '../../lib/items/item.predicates';
import { getGlobalMonitorButtonMode } from '../../lib/monitor/monitor-global-button';
import { excludeFromMonitoring, includeInMonitoring, setItemFlags } from '../../store/actions/creators/monitor';
import type { ShareItem } from '../../store/reducers';
import { PassFeature } from '../../types/api/features';
import type { ItemRevision } from '../../types/data/items';
import { useItemState } from '../items/useItemState';
import { useFeatureFlag } from '../useFeatureFlag';
import type { ItemMonitorChecksValue } from './ItemMonitorChecksContext';
import { useOptionalItemMonitorChecks } from './ItemMonitorChecksContext';
import { useItemMonitorChecks, useVisibleItemMonitorChecks } from './useItemMonitorChecks';

type UseGlobalMonitorButtonOptions = {
    /** When set, skips starting a duplicate async monitor scan for this item view. */
    checks?: ItemMonitorChecksValue;
};

export const useGlobalMonitorButton = (
    revision: ItemRevision,
    share: ShareItem,
    options?: UseGlobalMonitorButtonOptions
) => {
    const dispatch = useDispatch();
    const scope = useItemScope();
    const perCheckExclusionEnabled = useFeatureFlag(PassFeature.PassMonitorPerCheckExclusion);
    const { canMonitor, canUpdateMonitorFlags } = useItemState(revision, share);
    const sharedChecks = useOptionalItemMonitorChecks();
    const monitorChecksEnabled = perCheckExclusionEnabled && canMonitor;
    const shouldRunLocalChecks = monitorChecksEnabled && options?.checks === undefined && sharedChecks === null;
    const localChecks = useItemMonitorChecks(revision, shouldRunLocalChecks);
    const checks = options?.checks ?? sharedChecks ?? localChecks;
    const activeWarnings = useVisibleItemMonitorChecks(revision, false, checks);

    const mode = useMemo(
        () =>
            getGlobalMonitorButtonMode({
                activeWarningCount: activeWarnings.length,
                checksReady: !monitorChecksEnabled || !checks.loading,
                perCheckExclusionEnabled,
                revision,
                scope,
            }),
        [activeWarnings.length, checks.loading, monitorChecksEnabled, perCheckExclusionEnabled, revision, scope]
    );

    const loading = monitorChecksEnabled && checks.loading;

    const onClick = useCallback(() => {
        if (loading || !canUpdateMonitorFlags) return;

        const payload = { shareId: revision.shareId, itemId: revision.itemId };

        if (perCheckExclusionEnabled) {
            dispatch(mode === 'include' ? includeInMonitoring(payload) : excludeFromMonitoring(payload));
            return;
        }

        dispatch(
            setItemFlags.intent({
                ...payload,
                flags: { SkipHealthCheck: isMonitored(revision) },
                context: 'global-toggle',
            })
        );
    }, [canUpdateMonitorFlags, dispatch, loading, mode, perCheckExclusionEnabled, revision]);

    const label = mode === 'include' ? c('Action').t`Include in monitoring` : c('Action').t`Exclude from monitoring`;
    const icon: IconName = mode === 'include' ? 'eye' : 'eye-slash';

    return { icon, label, loading, mode, onClick };
};
