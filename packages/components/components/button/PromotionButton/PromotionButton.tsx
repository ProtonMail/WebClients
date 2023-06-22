import { Ref, forwardRef } from 'react';

import ButtonLike, { ButtonLikeProps, ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';
import { Icon, IconName, IconSize } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import './PromotionButton.scss';

interface PromotionButtonProps extends Omit<ButtonLikeProps<'button'>, 'as' | 'ref'> {
    iconName?: IconName;
    icon?: boolean;
    iconGradient?: boolean;
    upsell?: boolean;
    shape?: ButtonLikeShape;
}

const ButtonBase = (
    { children, iconName, icon, iconGradient = true, shape = 'outline', upsell, ...rest }: PromotionButtonProps,
    ref: Ref<HTMLButtonElement>
) => {
    let iconSize: IconSize | undefined;
    switch (true) {
        case icon && upsell:
            iconSize = 16;
            break;
        default:
            iconSize = 20;
            break;
    }

    return (
        <ButtonLike
            {...rest}
            type="button"
            icon={icon}
            color="weak"
            shape={shape}
            className={clsx(
                'button-promotion',
                iconGradient && 'button-promotion--icon-gradient',
                upsell && 'button-promotion--upgrade'
            )}
            ref={ref}
            as="button"
        >
            <span className="relative flex flex-nowrap flex-align-items-center gap-2">
                {iconName && <Icon name={iconName} size={iconSize} />}
                <span className={clsx(icon && 'sr-only')}>{children}</span>
            </span>
            {iconName && iconGradient ? (
                <svg aria-hidden="true" focusable="false" className="w0 h0 absolute">
                    <linearGradient id="gradient-horizontal">
                        <stop offset="0%" stop-color="var(--color-stop-1)" />
                        <stop offset="100%" stop-color="var(--color-stop-2)" />
                    </linearGradient>
                </svg>
            ) : undefined}
        </ButtonLike>
    );
};

export const PromotionButton = forwardRef<HTMLButtonElement, PromotionButtonProps>(ButtonBase);
