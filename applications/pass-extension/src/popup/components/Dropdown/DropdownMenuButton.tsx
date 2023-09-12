import type { FC, MouseEvent, ReactElement, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Dropdown, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import type { IconName } from '@proton/components/components';
import type { Props as DropdownMenuButtonCoreProps } from '@proton/components/components/dropdown/DropdownMenuButton';
import { default as DropdownMenuButtonCore } from '@proton/components/components/dropdown/DropdownMenuButton';
import clsx from '@proton/utils/clsx';

const QuickActionsDropdown: FC<{ children: ReactNode }> = ({ children }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleClick = (evt: MouseEvent) => {
        evt.stopPropagation();
        toggle();
    };

    return (
        <>
            <Button
                icon
                pill
                className="ml-1"
                color="weak"
                onClick={handleClick}
                ref={anchorRef}
                shape="ghost"
                title={c('Action').t`More options`}
            >
                <Icon name="three-dots-vertical" alt={c('Action').t`More options`} color="var(--text-weak)" />
            </Button>

            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>{children}</DropdownMenu>
            </Dropdown>
        </>
    );
};

type DropdownMenuButtonLabelProps = {
    label: string;
    labelClassname?: string;
    icon?: IconName | ReactElement;
    extra?: ReactNode;
    ellipsis?: boolean;
    danger?: boolean;
};

export const DropdownMenuButtonLabel: FC<DropdownMenuButtonLabelProps> = ({
    label,
    labelClassname,
    icon,
    extra,
    ellipsis = true,
    danger = false,
}) => {
    return (
        <span className="flex flex-align-items-center flex-nowrap gap-1">
            {typeof icon === 'string' ? (
                <Icon name={icon} className={clsx(danger ? 'color-danger' : 'color-weak', 'flex-item-noshrink mr-2')} />
            ) : (
                icon
            )}
            <span
                className={clsx(
                    'block text-left',
                    labelClassname,
                    ellipsis && 'text-ellipsis',
                    danger && 'color-danger'
                )}
            >
                {label}
            </span>
            {extra && <span className="flex-item-noshrink color-weak">{extra}</span>}
        </span>
    );
};

interface DropdownMenuButtonProps extends DropdownMenuButtonCoreProps, DropdownMenuButtonLabelProps {
    children?: ReactNode;
    className?: string;
    isSelected?: boolean;
    quickActions?: ReactNode;
    size?: 'small' | 'medium';
}

export const DropdownMenuButton: FC<DropdownMenuButtonProps> = ({
    children,
    className,
    isSelected,
    quickActions,
    size = 'medium',
    icon,
    danger,
    label,
    labelClassname,
    extra,
    ellipsis = true,
    ...rest
}) => (
    <div className="relative">
        <DropdownMenuButtonCore
            className={clsx(size === 'small' && 'text-sm', className)}
            // translator : "Selected" is singular only
            title={isSelected ? c('Label').t`Selected` : undefined}
            {...rest}
        >
            <div className={clsx('text-left', (quickActions !== undefined || isSelected) && 'max-w80')}>
                <DropdownMenuButtonLabel
                    label={label}
                    labelClassname={labelClassname}
                    icon={icon}
                    extra={extra}
                    ellipsis={ellipsis}
                    danger={danger}
                />
            </div>
        </DropdownMenuButtonCore>

        <div className="absolute flex flex-align-items-center h100 pr-2 right top">
            {isSelected && (
                <Icon
                    className={clsx(!quickActions && 'mr-2')}
                    name="checkmark"
                    color="var(--interaction-norm-major-1)"
                />
            )}
            {quickActions && <QuickActionsDropdown>{quickActions}</QuickActionsDropdown>}
        </div>
    </div>
);
