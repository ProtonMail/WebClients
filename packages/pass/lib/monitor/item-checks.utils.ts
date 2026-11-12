import type { ItemRevision, LoginItem } from '../../types/data/items';
import { hasDomain, isCheckIgnored, isFullyExcluded } from '../items/item.predicates';
import { MONITOR_CHECK_CONFIG, MonitorCheckType } from './types';

const isPerCheckIgnored = (type: MonitorCheckType, revision: ItemRevision) =>
    (revision.flags & MONITOR_CHECK_CONFIG[type].flag) === MONITOR_CHECK_CONFIG[type].flag;

const isMonitorCheckApplicable = (type: MonitorCheckType, revision: ItemRevision): boolean => {
    if (revision.data.type !== 'login') return false;

    const login = revision as LoginItem;

    switch (type) {
        case MonitorCheckType.MISSING_2FA:
            return hasDomain(login);
        case MonitorCheckType.WEAK:
        case MonitorCheckType.COMPROMISED:
        case MonitorCheckType.REUSED:
            return login.data.content.password.v.length > 0;
    }
};

const ITEM_MONITOR_CHECK_ORDER = [
    MonitorCheckType.COMPROMISED,
    MonitorCheckType.WEAK,
    MonitorCheckType.REUSED,
    MonitorCheckType.MISSING_2FA,
] as const;

export type ItemMonitorCheckState = Record<MonitorCheckType, boolean>;

export const getVisibleItemMonitorChecks = ({
    compromisedEnabled,
    excludedView,
    failing,
    revision,
}: {
    compromisedEnabled: boolean;
    excludedView: boolean;
    failing: ItemMonitorCheckState;
    revision: ItemRevision;
}): MonitorCheckType[] =>
    ITEM_MONITOR_CHECK_ORDER.filter((type) => {
        if (type === MonitorCheckType.COMPROMISED && !compromisedEnabled) return false;

        const ignored = isCheckIgnored(type)(revision);

        if (excludedView) {
            if (!ignored || !isMonitorCheckApplicable(type, revision)) return false;
            if (isPerCheckIgnored(type, revision)) return true;
            if (!isFullyExcluded(revision)) return false;

            /* Global exclusion: monitor pipelines drop excluded items, so `failing` is
             * usually false. Show applicable checks (except reused, which needs a real match). */
            if (type === MonitorCheckType.REUSED) return failing[type];

            return true;
        }

        return failing[type] && !ignored;
    });
