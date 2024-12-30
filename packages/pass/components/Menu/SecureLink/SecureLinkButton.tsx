import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import type { RouteMatchProps } from '@proton/pass/components/Navigation/RouteMatch';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { UpsellRef } from '@proton/pass/constants';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import clsx from '@proton/utils/clsx';

type SecureLinkButtonProps = RouteMatchProps & {
    className?: string;
    parentClassName?: string;
    onClick: () => void;
};

export const SecureLinkButton: FC<SecureLinkButtonProps> = ({ active, className, parentClassName, onClick }) => {
    const spotlight = useSpotlight();
    const passPlan = useSelector(selectPassPlan);
    const free = passPlan === UserPassPlan.FREE;

    return (
        <DropdownMenuButton
            icon="link"
            className={clsx(className, active && 'is-selected')}
            label={c('Action').t`Secure links`}
            onClick={
                free
                    ? () =>
                          spotlight.setUpselling({
                              type: 'pass-plus',
                              upsellRef: UpsellRef.SECURE_LINKS,
                          })
                    : () => !active && onClick()
            }
            parentClassName={parentClassName}
            extra={free && <PassPlusPromotionButton style={{ '--background-norm': 'var(--background-strong)' }} />}
        />
    );
};
