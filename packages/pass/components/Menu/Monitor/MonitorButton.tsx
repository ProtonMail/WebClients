import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import type { IconName } from '@proton/components/index';
import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { selectTotalBreaches } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import clsx from '@proton/utils/clsx';

export const MonitorButton: FC = () => {
    const { navigate } = useNavigation();
    const enabled = useFeatureFlag(PassFeature.PassMonitor);
    const breachCount = useSelector(selectTotalBreaches) ?? 0;
    const isActive = useRouteMatch(getLocalPath('monitor'));

    const monitorIcon = ((): IconName => {
        if (breachCount > 0) return enabled ? 'pass-shield-monitoring-warning' : 'pass-shield-warning';
        else return enabled ? 'pass-shield-monitoring-ok' : 'pass-shield-ok';
    })();

    return (
        <DropdownMenuButton
            icon={monitorIcon}
            className={clsx('rounded', isActive && 'color-primary bg-weak')}
            ellipsis
            label={c('Action').t`Pass Monitor`}
            extra={
                breachCount > 0 && (
                    <PillBadge
                        label={breachCount}
                        color="var(--signal-danger-contrast)"
                        backgroundColor="var(--signal-danger)"
                    />
                )
            }
            onClick={() => navigate(getLocalPath('monitor'))}
            parentClassName="mx-3"
        />
    );
};
