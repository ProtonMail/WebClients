import React, { ReactNode } from 'react';
import { classnames } from 'react-components';

interface Props {
    disabled?: boolean;
    loading?: boolean;
    children: ReactNode;
    className?: string;
    title?: string;
    [rest: string]: any;
}

const ToolbarButton = ({ children, loading = false, disabled = false, className = '', ...rest }: Props) => {
    return (
        <button
            type="button"
            disabled={disabled || loading}
            className={classnames(['toolbar-button', className])}
            {...rest}
        >
            {children}
        </button>
    );
};

export default ToolbarButton;
