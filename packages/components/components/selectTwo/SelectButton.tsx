import type { ComponentPropsWithRef, KeyboardEvent, ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import useInstance from '@proton/hooks/useInstance';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import DropdownCaret from '../dropdown/DropdownCaret';
import type { NodeOrBoolean } from '../v2/field/InputField';

interface SelectButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'value'> {
    unstyled?: boolean;
    loading?: boolean;
    error?: NodeOrBoolean;
    isOpen?: boolean;
    onOpen?: () => void;
    noCaret?: boolean;
    caretIcon?: ReactElement;
    caretClassName?: string;
    fullWidth?: boolean;
    prefixIcon?: ReactNode;
    /**
     * Text of the selected value. It names the button unless `aria-label` or `aria-labelledby` is passed, in which case
     * the value describes it instead. Label a select with one of those (or `InputFieldTwo` / `SettingsSelectRow`,
     * which pass `aria-labelledby`), not only with `<label htmlFor>`, which the value would override.
     */
    valueLabel?: string;
}

const SelectButton = forwardRef<HTMLButtonElement, SelectButtonProps>(
    (
        {
            className,
            unstyled,
            loading,
            error,
            isOpen,
            onOpen,
            children,
            noCaret,
            caretIcon,
            caretClassName,
            fullWidth = true,
            prefixIcon,
            valueLabel,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledBy,
            'aria-describedby': ariaDescribedBy,
            ...rest
        },
        ref
    ) => {
        const valueId = useInstance(() => generateUID('select-value'));
        const isNamedByValue = !ariaLabel && !ariaLabelledBy;
        const describedBy =
            [isNamedByValue ? undefined : valueId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

        const handleAnchorKeydown = (e: KeyboardEvent<HTMLButtonElement>) => {
            switch (e.key) {
                case ' ': {
                    onOpen?.();
                    break;
                }

                default:
            }
        };

        return (
            // eslint-disable-next-line jsx-a11y/role-supports-aria-props
            <button
                ref={ref}
                type="button"
                onKeyDown={handleAnchorKeydown}
                aria-expanded={isOpen}
                aria-busy={loading}
                // eslint-disable-next-line jsx-a11y/role-supports-aria-props -- the error state is exposed on the button
                aria-invalid={Boolean(error)}
                aria-label={isNamedByValue ? valueLabel || undefined : ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={describedBy}
                className={clsx([
                    !unstyled && 'select field',
                    unstyled && 'select-unstyled',
                    isOpen && 'select--open',
                    'outline-none flex justify-space-between items-center flex-nowrap *:pointer-events-none',
                    fullWidth && 'w-full',
                    className,
                ])}
                {...rest}
            >
                {prefixIcon && <span className="inline-flex">{prefixIcon}</span>}
                <span id={valueId} className="flex-1 text-ellipsis text-left">
                    {children}
                </span>

                {
                    // eslint-disable-next-line no-nested-ternary
                    loading ? (
                        <CircleLoader className="shrink-0 ml-1" />
                    ) : noCaret ? null : (
                        <DropdownCaret
                            className={clsx('shrink-0 ml-1', caretClassName)}
                            icon={caretIcon}
                            isOpen={isOpen}
                        />
                    )
                }
            </button>
        );
    }
);

SelectButton.displayName = 'SelectButton';
export default SelectButton;
