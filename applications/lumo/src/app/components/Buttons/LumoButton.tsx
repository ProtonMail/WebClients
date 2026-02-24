import { clsx } from 'clsx';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { PopperPlacement } from '@proton/components/index';
import { Icon } from '@proton/components/index';
import type { IconName, IconSize } from '@proton/icons/types';

interface LumoButtonProps {
    iconName: IconName;
    title: string;
    alt?: string;
    isActive?: boolean;
    onClick?: () => void;
    tooltipPlacement?: PopperPlacement;
    size?: ButtonLikeSize;
    disabled?: boolean;
    buttonRef?: React.MutableRefObject<HTMLButtonElement | null>;
    className?: string;
    iconSize?: IconSize;
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
    iconSize = 4,
}: LumoButtonProps) => {
    return (
        <Tooltip title={title} originalPlacement={tooltipPlacement || 'right'}>
            <Button
                icon
                shape="ghost"
                className={clsx('shrink-0', className, isActive && 'is-active bg-transparent')}
                onClick={onClick}
                size={size || 'small'}
                disabled={disabled}
                ref={buttonRef}
                aria-pressed={isActive}
            >
                <Icon name={iconName} alt={alt} size={iconSize} />
            </Button>
        </Tooltip>
    );
};

export default LumoButton;
