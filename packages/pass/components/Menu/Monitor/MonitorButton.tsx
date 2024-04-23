import { type FC } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { getMonitorIcon } from '@proton/pass/components/Monitor/utils';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import clsx from '@proton/utils/clsx';

export const MonitorButton: FC = () => {
    const { navigate } = useNavigation();
    const monitor = useMonitor();
    const isActive = useRouteMatch(getLocalPath('monitor'));

    return (
        <DropdownMenuButton
            icon={getMonitorIcon(monitor)}
            className={clsx('rounded', isActive && 'color-primary bg-weak')}
            ellipsis
            label={
                <div className="flex flex-column flex-nowrap">
                    <span className="text-ellipsis">{c('Action').t`Pass monitor`}</span>
                </div>
            }
            extra={
                monitor.breaches.count > 0 && (
                    <PillBadge
                        label={monitor.breaches.count}
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
