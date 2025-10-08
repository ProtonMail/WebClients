import type { CSSProperties, FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';
import type { ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import Badge from '@proton/components/components/badge/Badge';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/components/components/icon/Icon';
import type { IconSize } from '@proton/components/components/icon/Icon';
import type { PopperPlacement } from '@proton/components/components/popper/interface';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import clsx from '@proton/utils/clsx';

import './QuickActionsDropdown.scss';

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
                className={clsx(className, 'pass-quickactions flex items-center gap-x-1', signaled && 'relative')}
                color={color}
                disabled={disabled}
                icon={badge === undefined}
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
                {badge && (
                    <Badge className="pass-quickactions--badge bg-primary ratio-square color-invert text-bold flex justify-center items-center lh120">
                        {badge}
                    </Badge>
                )}
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
