import type { CSSProperties, FC, PropsWithChildren } from 'react';

import { c } from 'ttag';

import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button';
import { Button } from '@proton/atoms/Button';
import { NotificationDot } from '@proton/atoms/NotificationDot';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import {
    Dropdown,
    DropdownMenu,
    Icon,
    type IconName,
    type IconSize,
    type PopperPlacement,
    usePopperAnchor,
} from '@proton/components/index';
import clsx from '@proton/utils/clsx';

export type QuickActionsDropdownProps = {
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

export const QuickActionsDropdown: FC<PropsWithChildren<QuickActionsDropdownProps>> = ({
    children,
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
                className={clsx(className, signaled && 'relative')}
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
                <DropdownMenu className={menuClassName}>{children}</DropdownMenu>
            </Dropdown>
        </>
    );
};
