import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { UpsellRef } from '@proton/pass/constants';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import clsx from '@proton/utils/clsx';

type SecureLinkButtonProps = {
    className?: string;
    activeClassName?: string;
    parentClassName?: string;
    onClick: () => void;
};

export const SecureLinkButton: FC<SecureLinkButtonProps> = ({
    className,
    activeClassName,
    parentClassName,
    onClick,
}) => {
    const isActive = useRouteMatch(getLocalPath('secure-links'));
    const spotlight = useSpotlight();
    const passPlan = useSelector(selectPassPlan);

    return (
        <DropdownMenuButton
            icon="link"
            className={clsx(className, isActive && activeClassName)}
            label={c('Action').t`Secure links`}
            onClick={
                passPlan === UserPassPlan.FREE
                    ? () =>
                          spotlight.setUpselling({
                              type: 'pass-plus',
                              upsellRef: UpsellRef.FREE_TRIAL,
                          })
                    : onClick
            }
            parentClassName={parentClassName}
            extra={
                passPlan === UserPassPlan.FREE && <Icon name="upgrade" size={4} style={{ color: 'var(--primary)' }} />
            }
        />
    );
};
