import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { getMonitorIcon } from '@proton/pass/components/Monitor/utils';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { selectMonitorSummary } from '@proton/pass/store/selectors/monitor';
import clsx from '@proton/utils/clsx';

export const MonitorButton: FC = () => {
    const { navigate } = useNavigation();
    const summary = useSelector(selectMonitorSummary);
    const isActive = useRouteMatch(getLocalPath('monitor'));

    return (
        <DropdownMenuButton
            icon={getMonitorIcon(summary)}
            className={clsx('rounded', isActive && 'color-primary bg-weak')}
            ellipsis
            label={
                <div className="flex flex-column flex-nowrap">
                    <span className="text-ellipsis">{c('Action').t`Pass monitor`}</span>
                </div>
            }
            extra={
                summary.breaches > 0 && (
                    <PillBadge
                        label={summary.breaches}
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
