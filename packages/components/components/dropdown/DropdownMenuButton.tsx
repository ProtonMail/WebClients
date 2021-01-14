import React from 'react';
import { classnames } from '../../helpers';

export interface Props extends React.ComponentPropsWithRef<'button'> {
    loading?: boolean;
    isSelected?: boolean;
    /*
     * Used by DropdownMenu to add CSS classes to the parent li
     */
    liClassName?: string;
    actionType?: 'delete';
}

const DropdownMenuButton = React.forwardRef<HTMLButtonElement, Props>(
    (
        {
            className = '',
            isSelected,
            disabled,
            loading,
            children,
            liClassName, // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars
            actionType, // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars
            ...rest
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                type="button"
                disabled={disabled || loading}
                className={classnames([
                    'dropDown-item-button w100 pr1 pl1 pt0-5 pb0-5',
                    isSelected && 'dropDown-item--isSelected',
                    className,
                ])}
                aria-busy={loading}
                {...rest}
            >
                {loading ? <span className="bl ellipsis">{children}</span> : children}
            </button>
        );
    }
);

export default DropdownMenuButton;
