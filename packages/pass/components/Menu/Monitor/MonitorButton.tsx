import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { selectTotalBreaches } from '../../../store/selectors';
import { PillBadge } from '../../Layout/Badge/PillBadge';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { useNavigate } from '../../Navigation/NavigationActions';
import type { RouteMatchProps } from '../../Navigation/RouteMatch';
import { getLocalPath } from '../../Navigation/routing';

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
