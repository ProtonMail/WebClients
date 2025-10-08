import type { CSSProperties, FC, MouseEventHandler } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import type { PromotionButtonProps } from '@proton/components/components/button/PromotionButton/PromotionButton';
import type { IconSize } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import type { UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import './PassPlusPromotionButton';

type UpgradeButtonProps = PromotionButtonProps<typeof ButtonLike> & {
    buttonSize?: ButtonLikeSize;
    className?: string;
    iconSize?: IconSize;
    gradient?: boolean;
    inline?: boolean;
    label?: string;
    onClick?: () => void;
    path?: string;
    style?: CSSProperties;
    upsellRef: UpsellRef;
};

export const UpgradeButton: FC<UpgradeButtonProps> = ({
    buttonSize,
    className,
    iconSize,
    gradient = false,
    inline = false,
    label,
    onClick = noop,
    path,
    style,
    upsellRef,
    ...rest
}) => {
    const ButtonComponent = (() => {
        if (inline) return ButtonLike;
        return gradient ? PromotionButton : Button;
    })();

    const buttonProps = inline ? ({ as: 'a', shape: 'underline' } as const) : ({ pill: true, shape: 'solid' } as const);

    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef, path });

    /** `onClick` may trigger async wrapped code - since `navigateToUpgrade`
     * will close the popup, ensure we execute `navigateToUpgrade` on next tick */
    const handleClick: MouseEventHandler = (evt) => {
        evt.stopPropagation();
        onClick?.();
        void wait(0).then(() => navigateToUpgrade());
    };

    return (
        <ButtonComponent
            className={clsx(
                'items-center flex-nowrap shrink-0',
                inline ? 'inline-flex link link-focus align-baseline text-left p-0' : 'flex',
                gradient && BUILD_TARGET === 'safari' && 'pass-promo-btn--safari-ext',
                className
            )}
            color="norm"
            onClick={handleClick}
            size={buttonSize}
            style={style}
            {...buttonProps}
            {...rest}
        >
            {label || c('Action').t`Upgrade`}
            {!gradient && <Icon className="ml-2" name="arrow-out-square" size={iconSize} />}
        </ButtonComponent>
    );
};
