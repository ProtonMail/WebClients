import { ComponentPropsWithoutRef, HTMLProps, MouseEvent, ReactElement, ReactNode, forwardRef } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { Icon } from '../icon';
import { Tooltip } from '../tooltip';

interface AddressesInputItemProps extends ComponentPropsWithoutRef<'div'> {
    iconTooltipTitle?: string;
    labelTooltipTitle?: string;
    onRemove: (event: MouseEvent<HTMLButtonElement>) => void;
    icon?: ReactElement;
    label?: string;
    labelProps?: HTMLProps<HTMLSpanElement> & { 'data-testid'?: string };
    removeProps?: HTMLProps<HTMLButtonElement> & { 'data-testid'?: string };
}

export const AddressesInputItem = forwardRef<HTMLDivElement, AddressesInputItemProps>(function AddressesInputItemProps(
    {
        className,
        children,
        icon,
        iconTooltipTitle,
        label,
        labelProps: { className: labelClassName, ...labelRest } = {},
        labelTooltipTitle,
        removeProps,
        onRemove,
        ...rest
    },
    ref
) {
    const wrappedLabel = (
        <span className={clsx(['pill-label my-auto px0-5 text-ellipsis', labelClassName])} {...labelRest}>
            {label}
        </span>
    );

    return (
        <>
            <div
                className={clsx([
                    'pill my-1 mr-2 flex flex-nowrap flex-row max-w100 overflow-hidden stop-propagation cursor-grab rounded',
                    className,
                ])}
                ref={ref}
                {...rest}
            >
                <span className="interactive flex flex-row flex-nowrap">
                    {iconTooltipTitle && icon ? <Tooltip title={iconTooltipTitle}>{icon}</Tooltip> : icon}
                    {labelTooltipTitle ? <Tooltip title={labelTooltipTitle}>{wrappedLabel}</Tooltip> : wrappedLabel}
                </span>

                <Tooltip title={c('Action').t`Remove`}>
                    <button
                        {...removeProps}
                        className="pill-remove inline-flex flex-item-noshrink p0-5 no-pointer-events-children h100 interactive"
                        onClick={onRemove}
                        type="button"
                    >
                        <Icon name="cross" size={12} className="m-auto" />
                        <span className="sr-only">{c('Action').t`Remove`}</span>
                    </button>
                </Tooltip>
            </div>
            {children}
        </>
    );
});

interface AddressesInputProps {
    className?: string;
    children?: ReactNode;
    items?: ReactNode;
    placeholder?: ReactNode;
    autocomplete: ReactNode;
    autocompleteContainerProps?: HTMLProps<HTMLDivElement>;
    inputContainerClassName?: string;
    onClick?: () => void;
}

const AddressesInput = forwardRef<HTMLDivElement, AddressesInputProps>(function AddressesInputComponent(
    {
        className,
        children,
        items,
        placeholder,
        autocomplete,
        autocompleteContainerProps: { className: autocompleteContainerClassName, ...autocompleteContainerRest } = {},
        inputContainerClassName,
        onClick,
    },
    ref
) {
    return (
        <div className={clsx(['w100 flex-item-fluid relative', className])} ref={ref} onClick={onClick}>
            <div
                className={clsx(['flex-no-min-children flex-item-fluid', autocompleteContainerClassName])}
                {...autocompleteContainerRest}
            >
                <div className="flex-item-fluid flex max-w100 max-h100 relative">
                    {items}
                    {placeholder}
                    <div className="flex max-w100 max-h100 relative flex-item-grow-2">
                        <div
                            className={clsx(['flex-item-fluid flex flex-align-items-center', inputContainerClassName])}
                        >
                            {autocomplete}
                        </div>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
});

export default AddressesInput;
