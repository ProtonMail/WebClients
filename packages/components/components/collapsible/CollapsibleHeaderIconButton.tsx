import clsx from '@proton/utils/clsx';

import CollapsibleHeaderButton, { CollapsibleHeaderButtonProps } from './CollapsibleHeaderButton';

import './CollapsibleHeaderIconButton.scss';

export interface CollapsibleHeaderIconButtonProps extends Omit<CollapsibleHeaderButtonProps, 'icon'> {}

/**
 * Icon button which rotates the icon by 180° when collapsible is toggled.
 */
const CollapsibleHeaderIconButton = ({ children, className, ...rest }: CollapsibleHeaderIconButtonProps) => {
    return (
        <CollapsibleHeaderButton
            className={clsx('collapsible-header-icon-button', className)}
            shape="ghost"
            color="weak"
            {...rest}
            icon
        >
            {children}
        </CollapsibleHeaderButton>
    );
};

export default CollapsibleHeaderIconButton;
