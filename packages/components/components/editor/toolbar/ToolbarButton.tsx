import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

import Tooltip from '../../tooltip/Tooltip';
import { classnames } from '../../../helpers';

const ToolbarButton = ({
    children,
    disabled = false,
    className = '',
    title,
    onClick,
}: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => (
    <Tooltip title={title}>
        <button
            type="button"
            disabled={disabled}
            className={classnames(['editor-toolbar-button interactive m0 flex', className])}
            onClick={onClick}
        >
            {children}
        </button>
    </Tooltip>
);

export default ToolbarButton;
