import type { ForwardRefRenderFunction } from 'react';
import {
    Children,
    type FC,
    type MouseEvent,
    type ReactElement,
    type ReactNode,
    cloneElement,
    forwardRef,
    isValidElement,
} from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Dropdown, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import type { Props as DropdownMenuButtonCoreProps } from '@proton/components/components/dropdown/DropdownMenuButton';
import { default as DropdownMenuButtonCore } from '@proton/components/components/dropdown/DropdownMenuButton';
import clsx from '@proton/utils/clsx';

type QuickActionChildProp = { onClick: (evt: MouseEvent) => void };
type QuickActionChild = ReactElement<QuickActionChildProp>;

const QuickActionsDropdown: FC<{ children: QuickActionChild[] }> = ({ children }) => {
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
                <DropdownMenu>
                    {Children.toArray(children).map((child) =>
                        isValidElement<QuickActionChildProp>(child)
                            ? cloneElement<QuickActionChildProp>(child, {
                                  onClick: (evt: MouseEvent) => {
                                      child.props.onClick?.(evt);
                                      close();
                                  },
                              })
                            : null
                    )}
                </DropdownMenu>
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
    const strLabel = typeof label === 'string';

    return (
        <div className="flex justify-space-between items-center flex-nowrap gap-2 max-h-custom">
            <div className={clsx(labelClassname, 'flex items-center flex-nowrap gap-2')}>
                {typeof icon === 'string' ? (
                    <Icon name={icon} className={clsx(danger ? 'color-danger' : 'color-weak', 'shrink-0')} />
                ) : (
                    icon
                )}
                <div className={clsx('flex flex-nowrap flex-auto gap-1', danger && 'color-danger')}>
                    {strLabel ? <span className={clsx(ellipsis && 'text-ellipsis')}>{label}</span> : label}
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
    quickActions?: QuickActionChild[];
    size?: 'small' | 'medium';
}

const DropdownMenuButtonRender: ForwardRefRenderFunction<HTMLDivElement, DropdownMenuButtonProps> = (
    {
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
    },
    ref
) => {
    const extraPadding = quickActions !== undefined ? 'pr-3' : '';

    return (
        <div className={clsx('relative shrink-0', parentClassName)} style={style} ref={ref}>
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
                    labelClassname={clsx('text-left', labelClassname)}
                    extra={
                        <div className={clsx('flex items-center shrink-0 flex-nowrap color-weak', extraPadding)}>
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

            <div className="absolute flex items-center h-full right-0 top-0">
                {quickActions && <QuickActionsDropdown>{quickActions}</QuickActionsDropdown>}
            </div>
        </div>
    );
};

export const DropdownMenuButton = forwardRef(DropdownMenuButtonRender);
