import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { UpsellRef } from '../../../constants';
import { selectPassPlan } from '../../../store/selectors';
import { UserPassPlan } from '../../../types/api/plan';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import type { RouteMatchProps } from '../../Navigation/RouteMatch';
import { PassPlusPromotionButton } from '../../Upsell/PassPlusPromotionButton';
import { useUpselling } from '../../Upsell/UpsellingProvider';

type SecureLinkButtonProps = RouteMatchProps & {
    className?: string;
    parentClassName?: string;
    onClick: () => void;
};

export const SecureLinkButton: FC<SecureLinkButtonProps> = ({ active, className, parentClassName, onClick }) => {
    const upsell = useUpselling();
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
                          upsell({
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
