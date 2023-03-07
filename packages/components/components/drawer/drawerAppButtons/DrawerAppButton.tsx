import { HTMLAttributes, ReactNode } from 'react';

import { Tooltip } from '@proton/components/components';

export interface Props extends HTMLAttributes<HTMLButtonElement> {
    tooltipText: string;
    buttonContent: ReactNode;
    onClick: () => void;
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
}

const DrawerAppButton = ({ tooltipText, buttonContent, onClick, alt, ...rest }: Props) => {
    const button = (
        <button
            className="drawer-sidebar-button rounded flex interactive no-pointer-events-children"
            type="button"
            onClick={onClick}
            {...rest}
        >
            {buttonContent}
            {alt ? <span className="sr-only">{alt}</span> : null}
        </button>
    );

    return (
        <Tooltip title={tooltipText} originalPlacement="left">
            {button}
        </Tooltip>
    );
};

export default DrawerAppButton;
