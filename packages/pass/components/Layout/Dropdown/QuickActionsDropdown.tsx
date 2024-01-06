import type { CSSProperties, FC } from 'react';

import { c } from 'ttag';

import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button';
import { Button } from '@proton/atoms/Button';
import {
    Dropdown,
    DropdownMenu,
    Icon,
    type IconName,
    type IconSize,
    type PopperPlacement,
    usePopperAnchor,
} from '@proton/components/index';

export type QuickActionsDropdownProps = {
    className?: string;
    color?: 'weak' | 'norm';
    disabled?: boolean;
    icon?: IconName;
    iconSize?: IconSize;
    menuClassName?: string;
    offset?: number;
    originalPlacement?: PopperPlacement;
    pill?: boolean;
    shape?: ButtonLikeShape;
    size?: ButtonLikeSize;
    style?: CSSProperties;
};

export const QuickActionsDropdown: FC<QuickActionsDropdownProps> = ({
    children,
    className,
    color,
    disabled,
    icon = 'three-dots-vertical',
    iconSize = 20,
    menuClassName,
    offset,
    originalPlacement,
    pill = true,
    shape,
    size = 'medium',
    style,
}) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <Button
                className={className}
                color={color}
                disabled={disabled}
                icon
                onClick={toggle}
                pill={pill}
                ref={anchorRef}
                shape={shape}
                size={size}
                style={style}
                title={c('Action').t`More options`}
            >
                <Icon name={icon} alt={c('Action').t`More options`} size={iconSize} />
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
