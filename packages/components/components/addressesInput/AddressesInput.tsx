import type { ComponentPropsWithoutRef, HTMLProps, MouseEvent, ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

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
        <span className={clsx(['pill-label my-auto px-2 text-ellipsis', labelClassName])} {...labelRest}>
            {label}
        </span>
    );

    return (
        <>
            <div
                className={clsx([
                    'pill my-1 mr-2 flex flex-nowrap flex-row max-w-full overflow-hidden stop-propagation cursor-grab rounded',
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
                        className="pill-remove inline-flex shrink-0 p-2 *:pointer-events-none h-full interactive"
                        onClick={onRemove}
                        type="button"
                    >
                        <Icon name="cross" size={3} className="m-auto" />
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
        <div className={clsx(['w-full flex-1 relative', className])} ref={ref} onClick={onClick}>
            <div
                className={clsx(['flex *:min-size-auto flex-1', autocompleteContainerClassName])}
                {...autocompleteContainerRest}
            >
                <div className="flex-1 flex max-w-full max-h-full relative">
                    {items}
                    {placeholder}
                    <div className="flex max-w-full max-h-full relative grow-2">
                        <div className={clsx(['flex-1 flex items-center', inputContainerClassName])}>
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
