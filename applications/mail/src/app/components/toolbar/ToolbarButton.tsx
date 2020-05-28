import React, { ReactNode } from 'react';
import { classnames, Tooltip } from 'react-components';

interface Props {
    disabled?: boolean;
    loading?: boolean;
    children: ReactNode;
    className?: string;
    title?: string;
    [rest: string]: any;
}

const ToolbarButton = ({ children, title, loading = false, disabled = false, className = '', ...rest }: Props) => {
    return (
        <Tooltip title={title} className="flex flex-item-noshrink">
            <button
                type="button"
                disabled={disabled || loading}
                className={classnames(['toolbar-button', className])}
                {...rest}
            >
                {children}
            </button>
        </Tooltip>
    );
};

export default ToolbarButton;
