import type { CSSProperties, VFC } from 'react';

import { c } from 'ttag';

import { Button, type ButtonLikeSize, InlineLinkButton } from '@proton/atoms';
import type { IconSize } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import { type UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type UpgradeButtonProps = {
    buttonSize?: ButtonLikeSize;
    className?: string;
    iconSize?: IconSize;
    inline?: boolean;
    label?: string;
    onClick?: () => void;
    path?: string;
    style?: CSSProperties;
    upsellRef: UpsellRef;
};

export const UpgradeButton: VFC<UpgradeButtonProps> = ({
    buttonSize,
    className,
    iconSize,
    inline = false,
    label,
    onClick = noop,
    path,
    style,
    upsellRef,
}) => {
    const ButtonComponent = inline ? InlineLinkButton : Button;
    const buttonProps = { pill: true, shape: 'solid' } as const;
    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef, path });

    /** `onClick` may trigger async wrapped code - since `navigateToUpgrade`
     * will close the popup, ensure we execute `navigateToUpgrade` on next tick */
    const handleClick = async () => {
        onClick?.();
        await wait(0);
        navigateToUpgrade();
    };

    return (
        <ButtonComponent
            className={clsx('items-center flex-nowrap shrink-0', inline ? 'inline-flex' : 'flex', className)}
            color="norm"
            onClick={handleClick}
            size={buttonSize}
            style={style}
            {...(!inline && buttonProps)}
        >
            {label || c('Action').t`Upgrade`}
            <Icon className="ml-2" name="arrow-out-square" size={iconSize} />
        </ButtonComponent>
    );
};
