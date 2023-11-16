import type { FC } from 'react';

import { c } from 'ttag';

import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button';
import { Button } from '@proton/atoms/Button';
import {
    Dropdown,
    DropdownMenu,
    Icon,
    type IconSize,
    type PopperPlacement,
    usePopperAnchor,
} from '@proton/components/index';

export type QuickActionsDropdownProps = {
    className?: string;
    color?: 'weak' | 'norm';
    disabled?: boolean;
    iconSize?: IconSize;
    menuClassName?: string;
    offset?: number;
    originalPlacement?: PopperPlacement;
    shape?: ButtonLikeShape;
    size?: ButtonLikeSize;
};

export const QuickActionsDropdown: FC<QuickActionsDropdownProps> = ({
    children,
    className,
    color,
    disabled,
    iconSize = 20,
    menuClassName,
    offset,
    originalPlacement,
    shape,
    size = 'medium',
}) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <Button
                icon
                pill
                color={color}
                shape={shape}
                size={size}
                className={className}
                ref={anchorRef}
                onClick={toggle}
                disabled={disabled}
                title={c('Action').t`More options`}
            >
                <Icon name="three-dots-vertical" alt={c('Action').t`More options`} size={iconSize} />
            </Button>

            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement={originalPlacement}
                offset={offset}
            >
                <DropdownMenu className={menuClassName}>{children}</DropdownMenu>
            </Dropdown>
        </>
    );
};
