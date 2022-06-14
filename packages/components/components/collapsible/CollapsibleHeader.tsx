import { ElementType, ReactNode, useContext } from 'react';
import { Box, PolymorphicComponentProps } from 'react-polymorphic-box';

import clsx from '@proton/utils/clsx';
import CollapsibleContext from './CollapsibleContext';

import './CollapsibleHeader.scss';

export interface CollapsibleHeaderOwnProps {
    /**
     * Component to append to the end of the header
     */
    suffix?: ReactNode;
    /**
     * Disables the header content from growing to fill available space.
     */
    disableFullWidth?: boolean;
    /**
     * Restricts the toggle click to only the expand icon.
     */
    disableContainerToggle?: boolean;
}

export type CollapsibleHeaderProps<E extends ElementType> = PolymorphicComponentProps<E, CollapsibleHeaderOwnProps>;

const element = 'header';

const CollapsibleHeader = <E extends ElementType = typeof element>({
    suffix,
    disableFullWidth,
    disableContainerToggle,
    className,
    children,
    onClick,
    ...rest
}: CollapsibleHeaderProps<E>) => {
    const { toggle, headerId } = useContext(CollapsibleContext);

    const handleContainerClick = () => {
        if (!disableContainerToggle) {
            toggle();
        }
        onClick?.();
    };

    return (
        <Box
            as={element}
            {...rest}
            onClick={handleContainerClick}
            className={clsx(
                className,
                'flex flex-nowrap flex-align-items-center',
                !disableContainerToggle && 'collapsible-header--clickable'
            )}
        >
            <div
                id={headerId}
                className={clsx(!disableFullWidth && 'flex-item-fluid')}
                data-testid="collapsible-header"
            >
                {children}
            </div>

            {suffix && <div className="flex flex-item-noshrink ml0-5">{suffix}</div>}
        </Box>
    );
};
export default CollapsibleHeader;
