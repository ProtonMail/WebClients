import { clsx } from 'clsx';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import type { ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import type { PopperPlacement } from '@proton/atoms/Popper/interface';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { type IconName, LumoIcon } from '../LumoIcon/LumoIcon';

interface LumoButtonProps extends Omit<ButtonProps, 'ref' | 'title'> {
    iconName: IconName;
    title: string;
    alt?: string;
    isActive?: boolean;
    tooltipPlacement?: PopperPlacement;
    size?: ButtonLikeSize;
    buttonRef?: React.MutableRefObject<HTMLButtonElement | null>;
    iconSize?: number;
}

const LumoButton = ({
    iconName,
    title,
    alt = title,
    isActive,
    onClick,
    tooltipPlacement,
    size,
    disabled,
    buttonRef,
    className,
    iconSize = 16,
    shape = 'solid',
    color = 'weak',
    ...rest
}: LumoButtonProps) => {
    return (
        <Tooltip title={title} originalPlacement={tooltipPlacement || 'right'}>
            <Button
                icon
                shape={shape}
                color={color}
                className={clsx('shrink-0', className, isActive && 'is-active bg-transparent')}
                onClick={onClick}
                size={size || 'small'}
                disabled={disabled}
                ref={buttonRef}
                aria-pressed={isActive}
                {...rest}
            >
                <LumoIcon name={iconName} aria-label={alt} size={iconSize} />
            </Button>
        </Tooltip>
    );
};

export default LumoButton;
