import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { selectTotalBreaches } from '@proton/pass/store/selectors';
import clsx from '@proton/utils/clsx';

export const MonitorButton: FC = () => {
    const { navigate } = useNavigation();
    const breachCount = useSelector(selectTotalBreaches) ?? 0;
    const isActive = useRouteMatch(getLocalPath('monitor'));

    return (
        <DropdownMenuButton
            icon={`pass-shield-monitoring-${breachCount ? 'warning' : 'ok'}`}
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
