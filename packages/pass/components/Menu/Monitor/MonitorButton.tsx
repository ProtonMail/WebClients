import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import type { RouteMatchProps } from '@proton/pass/components/Navigation/RouteMatch';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { selectTotalBreaches } from '@proton/pass/store/selectors';
import clsx from '@proton/utils/clsx';

export const MonitorButton: FC<RouteMatchProps> = ({ active, exact }) => {
    const navigate = useNavigate();
    const breachCount = useSelector(selectTotalBreaches) ?? 0;

    return (
        <DropdownMenuButton
            icon={`pass-shield-monitoring-${breachCount ? 'warning' : 'ok'}`}
            className={clsx('rounded', active && 'is-selected')}
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
            onClick={() => !exact && navigate(getLocalPath('monitor'))}
            parentClassName="mx-3"
        />
    );
};
