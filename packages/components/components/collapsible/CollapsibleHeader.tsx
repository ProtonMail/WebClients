import type { ElementType, ReactNode } from 'react';
import { useContext } from 'react';

import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

import CollapsibleContext from './CollapsibleContext';

import './CollapsibleHeader.scss';

interface CollapsibleHeaderOwnProps {
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
    gap?: number;
}

type CollapsibleHeaderProps<E extends ElementType> = PolymorphicPropsWithoutRef<CollapsibleHeaderOwnProps, E>;

const defaultElement = 'header';

const CollapsibleHeader = <E extends ElementType = typeof defaultElement>({
    suffix,
    disableFullWidth,
    disableContainerToggle,
    gap = 2,
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
                `gap-${gap}`,
                disabled && 'pointer-events-none',
                !disabled && !disableContainerToggle && 'collapsible-header--clickable'
            )}
        >
            <div id={headerId} className={clsx(!disableFullWidth && 'flex-1')} data-testid="collapsible-header">
                {children}
            </div>

            {suffix && <div className="flex shrink-0">{suffix}</div>}
        </Element>
    );
};
export default CollapsibleHeader;
