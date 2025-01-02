import type { CSSProperties, FC, ReactNode } from 'react';

import { c } from 'ttag';

import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms';
import { Button, NotificationDot } from '@proton/atoms';
import {
    Badge,
    Dropdown,
    DropdownMenu,
    Icon,
    type IconName,
    type IconSize,
    type PopperPlacement,
    usePopperAnchor,
} from '@proton/components';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import clsx from '@proton/utils/clsx';

export type QuickActionsDropdownProps = {
    children?: ReactNode | ((opened: boolean) => ReactNode);
    badge?: number;
    className?: string;
    color?: 'weak' | 'norm';
    disabled?: boolean;
    dropdownClassname?: string;
    dropdownHeader?: string;
    dropdownSize?: DropdownSize;
    icon?: IconName;
    iconSize?: IconSize;
    menuClassName?: string;
    offset?: number;
    originalPlacement?: PopperPlacement;
    pill?: boolean;
    shape?: ButtonLikeShape;
    signaled?: boolean;
    size?: ButtonLikeSize;
    style?: CSSProperties;
};

export const QuickActionsDropdown: FC<QuickActionsDropdownProps> = ({
    children,
    badge,
    className,
    color,
    disabled,
    dropdownClassname,
    dropdownHeader,
    dropdownSize,
    icon = 'three-dots-vertical',
    iconSize = 5,
    menuClassName,
    offset,
    originalPlacement,
    pill = true,
    shape,
    signaled = false,
    size = 'medium',
    style,
}) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <Button
                className={clsx(className, 'flex items-center gap-x-2', signaled && 'relative')}
                color={color}
                disabled={disabled}
                icon
                onClick={(evt) => {
                    evt.stopPropagation();
                    toggle();
                }}
                pill={pill}
                ref={anchorRef}
                shape={shape}
                size={size}
                style={style}
                title={dropdownHeader ?? c('Action').t`More options`}
            >
                <Icon name={icon} size={iconSize} />
                {signaled && <NotificationDot className="absolute top-0 right-0 w-2 h-2" />}
                {badge && <Badge className="shrink-0 bg-primary ratio-square color-invert text-bold">{badge}</Badge>}
            </Button>

            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement={originalPlacement}
                offset={offset}
                contentProps={{ className: dropdownClassname }}
                size={dropdownSize}
            >
                {dropdownHeader && <div className="text-bold px-4 my-2">{dropdownHeader}</div>}
                <DropdownMenu className={menuClassName}>
                    {children instanceof Function ? children(isOpen) : children}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
