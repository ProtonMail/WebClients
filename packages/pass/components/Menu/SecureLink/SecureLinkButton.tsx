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
    parentClassName?: string;
    onClick: () => void;
};

export const SecureLinkButton: FC<SecureLinkButtonProps> = ({ className, parentClassName, onClick }) => {
    const isSelected = useRouteMatch(getLocalPath('secure-links'));
    const spotlight = useSpotlight();
    const passPlan = useSelector(selectPassPlan);
    const free = passPlan === UserPassPlan.FREE;

    return (
        <DropdownMenuButton
            icon="link"
            className={clsx(className, isSelected && 'is-selected')}
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
            extra={free && <PassPlusPromotionButton style={{ '--background-norm': 'var(--background-strong)' }} />}
        />
    );
};
