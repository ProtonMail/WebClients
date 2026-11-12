import type { ItemScope } from '../../components/Navigation/routing';
import type { ItemRevision } from '../../types/data/items';
import { hasAnyExclusion, isMonitored } from '../items/item.predicates';

export type GlobalMonitorButtonMode = 'include' | 'exclude';

export const getGlobalMonitorButtonMode = ({
    activeWarningCount,
    checksReady = true,
    perCheckExclusionEnabled,
    revision,
    scope,
}: {
    activeWarningCount: number;
    checksReady?: boolean;
    perCheckExclusionEnabled: boolean;
    revision: ItemRevision;
    scope?: ItemScope;
}): GlobalMonitorButtonMode => {
    if (!perCheckExclusionEnabled) {
        return isMonitored(revision) ? 'exclude' : 'include';
    }

    if (scope === 'monitor/excluded' && hasAnyExclusion(revision)) {
        return 'include';
    }

    if (!checksReady) {
        return isMonitored(revision) ? 'exclude' : 'include';
    }

    if (hasAnyExclusion(revision) && activeWarningCount === 0) {
        return 'include';
    }

    return 'exclude';
};
