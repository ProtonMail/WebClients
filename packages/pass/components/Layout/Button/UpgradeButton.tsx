import type { CSSProperties, VFC } from 'react';

import { c } from 'ttag';

import { Button, type ButtonLikeSize, InlineLinkButton } from '@proton/atoms';
import type { IconSize } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import { type UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import clsx from '@proton/utils/clsx';

type UpgradeButtonProps = {
    buttonSize?: ButtonLikeSize;
    className?: string;
    inline?: boolean;
    iconSize?: IconSize;
    label?: string;
    path?: string;
    style?: CSSProperties;
    upsellRef: UpsellRef;
};

export const UpgradeButton: VFC<UpgradeButtonProps> = ({
    buttonSize,
    className,
    inline = false,
    label,
    path,
    iconSize,
    style,
    upsellRef,
}) => {
    const ButtonComponent = inline ? InlineLinkButton : Button;
    const buttonProps = { pill: true, shape: 'solid' } as const;
    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef, path });

    return (
        <ButtonComponent
            className={clsx('items-center flex-nowrap shrink-0', inline ? 'inline-flex' : 'flex', className)}
            color="norm"
            onClick={navigateToUpgrade}
            size={buttonSize}
            style={style}
            {...(!inline && buttonProps)}
        >
            {label || c('Action').t`Upgrade`}
            <Icon className="ml-2" name="arrow-out-square" size={iconSize} />
        </ButtonComponent>
    );
};
