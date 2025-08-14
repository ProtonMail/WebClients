import clsx from 'clsx';

import type { ButtonLikeSize } from '@proton/atoms';
import { Button, Tooltip } from '@proton/atoms';
import type { IconName, IconSize, PopperPlacement } from '@proton/components';
import { Icon } from '@proton/components';

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
