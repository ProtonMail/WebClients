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
                size="small"
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
    label: ReactNode;
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
        <div
            className="flex flex-justify-space-between flex-align-items-center flex-nowrap gap-2 max-h-custom"
            style={{ '--max-h-custom': '1.25rem' }}
        >
            <div className={clsx(labelClassname, 'flex flex-align-items-center flex-nowrap gap-2')}>
                {typeof icon === 'string' ? (
                    <Icon name={icon} className={clsx(danger ? 'color-danger' : 'color-weak', 'flex-item-noshrink')} />
                ) : (
                    icon
                )}
                <div
                    className={clsx(
                        'flex flex-nowrap flex-item-fluid-auto gap-1',
                        ellipsis && 'text-ellipsis',
                        danger && 'color-danger'
                    )}
                >
                    {label}
                </div>
            </div>
            {extra}
        </div>
    );
};

interface DropdownMenuButtonProps extends DropdownMenuButtonCoreProps, DropdownMenuButtonLabelProps {
    children?: ReactNode;
    className?: string;
    parentClassName?: string;
    isSelected?: boolean;
    quickActions?: ReactNode;
    size?: 'small' | 'medium';
}

export const DropdownMenuButton: FC<DropdownMenuButtonProps> = ({
    children,
    className,
    parentClassName,
    isSelected,
    quickActions,
    size = 'medium',
    icon,
    danger,
    label,
    labelClassname,
    extra,
    ellipsis = true,
    style,
    ...rest
}) => {
    const extraPadding = quickActions !== undefined ? 'pr-3' : '';

    return (
        <div className={clsx('relative flex-item-noshrink', parentClassName)} style={style}>
            <DropdownMenuButtonCore
                className={clsx(size === 'small' && 'text-sm', className)}
                // translator : "Selected" is singular only
                title={isSelected ? c('Label').t`Selected` : undefined}
                {...rest}
            >
                <DropdownMenuButtonLabel
                    icon={icon}
                    ellipsis={ellipsis}
                    danger={danger}
                    label={label}
                    labelClassname={labelClassname}
                    extra={
                        <div
                            className={clsx(
                                'flex flex-align-items-center flex-item-noshrink flex-nowrap color-weak',
                                extraPadding
                            )}
                        >
                            {isSelected && (
                                <div className={clsx('ml-auto')}>
                                    <Icon name="checkmark" color="var(--interaction-norm-major-1)" />
                                </div>
                            )}
                            {extra}
                        </div>
                    }
                />
            </DropdownMenuButtonCore>

            <div className="absolute flex flex-align-items-center h-full right top">
                {quickActions && <QuickActionsDropdown>{quickActions}</QuickActionsDropdown>}
            </div>
        </div>
    );
};
