import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
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
    const free = passPlan === UserPassPlan.FREE;

    return (
        <DropdownMenuButton
            icon="link"
            className={clsx(className, isActive && activeClassName)}
            label={c('Action').t`Secure links`}
            onClick={
                free
                    ? () =>
                          spotlight.setUpselling({
                              type: 'pass-plus',
                              upsellRef: UpsellRef.SECURE_LINKS,
                          })
                    : onClick
            }
            parentClassName={parentClassName}
            extra={free && <PassPlusPromotionButton />}
        />
    );
};
