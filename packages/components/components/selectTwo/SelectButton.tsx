import { ComponentPropsWithRef, forwardRef, KeyboardEvent } from 'react';

import { classnames } from '../../helpers';
import { DropdownCaret } from '../dropdown';
import { CircleLoader } from '../loader';

interface SelectButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'value'> {
    unstyled?: boolean;
    loading?: boolean;
    isOpen?: boolean;
    onOpen?: () => void;
}

const SelectButton = forwardRef<HTMLButtonElement, SelectButtonProps>(
    ({ className, unstyled, loading, isOpen, onOpen, children, ...rest }, ref) => {
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
            <button
                ref={ref}
                type="button"
                onKeyDown={handleAnchorKeydown}
                aria-expanded={isOpen}
                aria-busy={loading}
                aria-live="assertive"
                aria-atomic="true"
                className={classnames([
                    !unstyled && 'select field',
                    'outline-none w100 flex flex-justify-space-between flex-align-items-center flex-nowrap no-pointer-events-children',
                    className,
                ])}
                {...rest}
            >
                <span className="flex-item-fluid text-ellipsis text-left">{children}</span>

                {loading ? (
                    <CircleLoader className="flex-item-noshrink ml0-5" />
                ) : (
                    <DropdownCaret className="flex-item-noshrink ml0-5" isOpen={isOpen} />
                )}
            </button>
        );
    }
);

SelectButton.displayName = 'SelectButton';
export default SelectButton;
