import * as React from 'react';

import { classnames } from '../../helpers';
import { DropdownCaret } from '../dropdown';
import { CircleLoader } from '../loader';

interface SelectButtonProps extends Omit<React.ComponentPropsWithRef<'button'>, 'value'> {
    value?: React.ReactNode;
    loading?: boolean;
    isOpen?: boolean;
    onOpen?: () => void;
}

const SelectButton = React.forwardRef<HTMLButtonElement, SelectButtonProps>(
    ({ className, value, loading, isOpen, onOpen, children, ...rest }, ref) => {
        const handleAnchorKeydown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
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
                    'no-outline select field w100 flex flex-justify-space-between flex-align-items-center flex-nowrap',
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

export default SelectButton;
