import { ElementType, ReactNode, useContext } from 'react';
import { PolymorphicPropsWithoutRef } from 'react-polymorphic-types';

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

export type CollapsibleHeaderProps<E extends ElementType> = PolymorphicPropsWithoutRef<CollapsibleHeaderOwnProps, E>;

const defaultElement = 'header';

const CollapsibleHeader = <E extends ElementType = typeof defaultElement>({
    suffix,
    disableFullWidth,
    disableContainerToggle,
    className,
    children,
    onClick,
    as,
    ...rest
}: CollapsibleHeaderProps<E>) => {
    const { toggle, headerId, disabled } = useContext(CollapsibleContext);

    const handleContainerClick = () => {
        if (disabled) {
            return;
        }
        if (!disableContainerToggle) {
            toggle();
        }
        onClick?.();
    };

    const Element: ElementType = as || defaultElement;

    return (
        <Element
            disabled={disabled}
            {...rest}
            onClick={handleContainerClick}
            className={clsx(
                className,
                'flex flex-nowrap items-center',
                disabled && 'no-pointer-events',
                !disabled && !disableContainerToggle && 'collapsible-header--clickable'
            )}
        >
            <div
                id={headerId}
                className={clsx(!disableFullWidth && 'flex-item-fluid')}
                data-testid="collapsible-header"
            >
                {children}
            </div>

            {suffix && <div className="flex flex-item-noshrink ml-2">{suffix}</div>}
        </Element>
    );
};
export default CollapsibleHeader;
