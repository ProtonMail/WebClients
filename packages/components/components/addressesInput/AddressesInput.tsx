import { ComponentPropsWithoutRef, HTMLProps, MouseEvent, ReactNode, forwardRef } from 'react';

import { c } from 'ttag';

import { Icon, Tooltip, classnames } from '../..';

interface AddressesInputItemProps extends ComponentPropsWithoutRef<'div'> {
    labelTooltipTitle: string;
    onRemove: (event: MouseEvent<HTMLButtonElement>) => void;
    icon?: ReactNode;
    label?: string;
    labelProps?: HTMLProps<HTMLSpanElement> & { 'data-test-id'?: string };
    removeProps?: HTMLProps<HTMLButtonElement> & { 'data-test-id'?: string };
}

export const AddressesInputItem = forwardRef<HTMLDivElement, AddressesInputItemProps>(function AddressesInputItemProps(
    {
        className,
        children,
        icon,
        label,
        labelProps: { className: labelClassName, ...labelRest } = {},
        labelTooltipTitle,
        removeProps,
        onRemove,
        ...rest
    },
    ref
) {
    return (
        <>
            <div
                className={classnames([
                    'pill my0-25 mr0-5 flex flex-nowrap flex-row max-w100 overflow-hidden stop-propagation cursor-grab rounded',
                    className,
                ])}
                ref={ref}
                {...rest}
            >
                <span className="interactive flex flex-row flex-nowrap">
                    {icon}
                    <Tooltip title={labelTooltipTitle}>
                        <span
                            className={classnames(['pill-label mtauto mbauto px0-5 text-ellipsis', labelClassName])}
                            {...labelRest}
                        >
                            {label}
                        </span>
                    </Tooltip>
                </span>

                <Tooltip title={c('Action').t`Remove`}>
                    <button
                        {...removeProps}
                        className="pill-remove inline-flex p0-5 no-pointer-events-children h100 interactive"
                        onClick={onRemove}
                        type="button"
                    >
                        <Icon name="cross" size={12} className="mauto" />
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
        <div className={classnames(['w100 flex-item-fluid relative', className])} ref={ref} onClick={onClick}>
            <div
                className={classnames(['flex-no-min-children flex-item-fluid', autocompleteContainerClassName])}
                {...autocompleteContainerRest}
            >
                <div className="flex-item-fluid flex max-w100 max-h100 relative">
                    {items}
                    {placeholder}
                    <div className="flex max-w100 max-h100 relative flex-item-grow-2">
                        <div
                            className={classnames([
                                'flex-item-fluid flex flex-align-items-center',
                                inputContainerClassName,
                            ])}
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
