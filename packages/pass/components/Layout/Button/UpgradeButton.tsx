import { type VFC } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import { Icon } from '@proton/components/components';
import { type UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import clsx from '@proton/utils/clsx';

type UpgradeButtonProps = {
    className?: string;
    inline?: boolean;
    label?: string;
    path?: string;
    upsellRef: UpsellRef;
};

export const UpgradeButton: VFC<UpgradeButtonProps> = ({ className, inline = false, label, path, upsellRef }) => {
    const ButtonComponent = inline ? InlineLinkButton : Button;
    const buttonProps = { pill: true, shape: 'solid' } as const;
    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef, path });

    return (
        <ButtonComponent
            className={clsx('items-center flex-nowrap shrink-0', inline ? 'inline-flex' : 'flex', className)}
            color="norm"
            onClick={navigateToUpgrade}
            {...(!inline && buttonProps)}
        >
            {label || c('Action').t`Upgrade`}
            <Icon className="ml-2" name="arrow-out-square" />
        </ButtonComponent>
    );
};
