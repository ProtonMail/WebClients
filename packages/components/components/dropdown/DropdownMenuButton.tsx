import React from 'react';
import { classnames } from '../../helpers/component';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    loading?: boolean;
    isSelected?: boolean;
    /*
     * Used by DropdownMenu to add CSS classes to the parent li
     */
    liClassName?: string;
}

const DropdownMenuButton = ({
    className = '',
    isSelected,
    disabled,
    loading,
    children,
    liClassName, // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars
    ...rest
}: Props) => {
    return (
        <button
            type="button"
            disabled={disabled || loading}
            className={classnames([
                'dropDown-item-button w100 pr1 pl1 pt0-5 pb0-5',
                isSelected && 'dropDown-item--isSelected',
                className,
            ])}
            {...rest}
        >
            {children}
        </button>
    );
};

export default DropdownMenuButton;
