import type { ComponentPropsWithRef, KeyboardEvent } from 'react';
import { forwardRef } from 'react';

import { CircleLoader } from '@proton/atoms';
import DropdownCaret from '@proton/components/components/dropdown/DropdownCaret';
import { type IconName } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import type { NodeOrBoolean } from '../v2/field/InputField';

interface SelectButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'value'> {
    unstyled?: boolean;
    loading?: boolean;
    error?: NodeOrBoolean;
    isOpen?: boolean;
    onOpen?: () => void;
    noCaret?: boolean;
    caretIconName?: IconName;
    caretClassName?: string;
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
            caretIconName,
            caretClassName,
            ...rest
        },
        ref
    ) => {
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
                aria-live="assertive"
                aria-atomic="true"
                aria-invalid={Boolean(error)}
                className={clsx([
                    !unstyled && 'select field',
                    unstyled && 'select-unstyled',
                    isOpen && 'select--open',
                    'outline-none w-full flex justify-space-between items-center flex-nowrap *:pointer-events-none',
                    className,
                ])}
                {...rest}
            >
                <span className="flex-1 text-ellipsis text-left">{children}</span>

                {
                    // eslint-disable-next-line no-nested-ternary
                    loading ? (
                        <CircleLoader className="shrink-0 ml-1" />
                    ) : noCaret ? null : (
                        <DropdownCaret
                            className={clsx('shrink-0 ml-1', caretClassName)}
                            iconName={caretIconName}
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
