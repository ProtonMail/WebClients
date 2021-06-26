import React, { ReactNode } from 'react';

import Tooltip from '../../tooltip/Tooltip';
import { classnames } from '../../../helpers';

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
        <Tooltip title={title}>
            <button
                type="button"
                disabled={disabled || loading}
                className={classnames(['editor-toolbar-button interactive m0 flex', className])}
                {...rest}
            >
                {children}
            </button>
        </Tooltip>
    );
};

export default EditorToolbarButton;
