import React, { ReactNode } from 'react';
import { Tooltip } from 'react-components';

interface Props {
    disabled?: boolean;
    loading?: boolean;
    children: ReactNode;
    className?: string;
    title?: string;
    [rest: string]: any;
}

const EditorToolbarButton = ({
    children,
    loading = false,
    disabled = false,
    className = '',
    title,
    ...rest
}: Props) => {
    return (
        <Tooltip className={className} title={title}>
            <button
                type="button"
                // title={title}
                disabled={disabled || loading}
                className="editor-toolbar-button m0 flex"
                {...rest}
            >
                {children}
            </button>
        </Tooltip>
    );
};

export default EditorToolbarButton;
