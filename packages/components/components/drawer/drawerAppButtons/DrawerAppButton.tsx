import { HTMLAttributes, ReactNode } from 'react';

import { Tooltip } from '@proton/components/components';

export interface Props extends HTMLAttributes<HTMLButtonElement> {
    tooltipText: string;
    buttonContent: ReactNode;
    onClick: () => void;
}

const DrawerAppButton = ({ tooltipText, buttonContent, onClick, ...rest }: Props) => {
    const button = (
        <button className="drawer-sidebar-button rounded flex interactive" type="button" onClick={onClick} {...rest}>
            {buttonContent}
        </button>
    );

    return (
        <Tooltip title={tooltipText} originalPlacement="left">
            {button}
        </Tooltip>
    );
};

export default DrawerAppButton;
