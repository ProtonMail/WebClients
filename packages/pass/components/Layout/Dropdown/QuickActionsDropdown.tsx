import type { CSSProperties, FC, PropsWithChildren } from 'react';

import { c } from 'ttag';

import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button';
import { Button } from '@proton/atoms/Button';
import { NotificationDot } from '@proton/atoms/NotificationDot';
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
                title={c('Action').t`More options`}
            >
                <Icon name={icon} alt={c('Action').t`More options`} size={iconSize} />
                {signaled && <NotificationDot className="absolute top-0 right-0 w-2 h-2" />}
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
