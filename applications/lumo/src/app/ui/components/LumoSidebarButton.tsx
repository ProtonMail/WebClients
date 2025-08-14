import clsx from 'clsx';

import { Button, Tooltip } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';

interface LumoSidebarButtonProps {
    iconName: IconName;
    title: string;
    isActive?: boolean;
    onClick?: () => void;
    buttonRef?: React.MutableRefObject<HTMLButtonElement | null>;
    disabled?: boolean;
}

export const LumoSidebarButton = ({
    iconName,
    title,
    isActive,
    onClick,
    buttonRef,
    disabled,
}: LumoSidebarButtonProps) => {
    return (
        <Tooltip title={title} originalPlacement="right">
            <Button
                ref={buttonRef}
                icon
                shape="ghost"
                className={clsx('flex mx-auto', isActive && 'is-active')}
                onClick={onClick}
                disabled={disabled}
            >
                <Icon name={iconName} size={4} alt={title} />
            </Button>
        </Tooltip>
    );
};
