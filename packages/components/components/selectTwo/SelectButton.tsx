import { ComponentPropsWithRef, KeyboardEvent, forwardRef } from 'react';

import { CircleLoader } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { DropdownCaret } from '../dropdown';
import type { IconName } from '../icon/Icon';
import { NodeOrBoolean } from '../v2/field/InputField';

interface SelectButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'value'> {
    unstyled?: boolean;
    caretIconName?: IconName;
    loading?: boolean;
    error?: NodeOrBoolean;
    isOpen?: boolean;
    onOpen?: () => void;
}

const SelectButton = forwardRef<HTMLButtonElement, SelectButtonProps>(
    ({ className, unstyled, caretIconName, loading, error, isOpen, onOpen, children, ...rest }, ref) => {
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
                    'outline-none w-full flex justify-space-between items-center flex-nowrap no-pointer-events-children',
                    className,
                ])}
                {...rest}
            >
                <span className="flex-item-fluid text-ellipsis text-left">{children}</span>

                {loading ? (
                    <CircleLoader className="flex-item-noshrink ml-1" />
                ) : (
                    <DropdownCaret className="flex-item-noshrink ml-1" isOpen={isOpen} />
                )}
            </button>
        );
    }
);

SelectButton.displayName = 'SelectButton';
export default SelectButton;
