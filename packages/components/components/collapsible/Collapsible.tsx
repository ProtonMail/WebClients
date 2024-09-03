import type { ElementType } from 'react';
import { Children, useState } from 'react';

import generateUID from '@proton/atoms/generateUID';
import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';

import type { CollapsibleContextValue } from './CollapsibleContext';
import CollapsibleContext from './CollapsibleContext';

export interface CollapsibleOwnProps {
    /**
     * Disables the collapsible component
     */
    disabled?: boolean;
    /**
     * Shows content by default if true.
     */
    expandByDefault?: boolean;
}

export type CollapsibleProps<E extends ElementType> = PolymorphicPropsWithoutRef<CollapsibleOwnProps, E>;

const defaultElement = 'div';

const Collapsible = <E extends ElementType = typeof defaultElement>({
    disabled = false,
    expandByDefault = false,
    children: childrenProp,
    as,
    ...rest
}: CollapsibleProps<E>) => {
    const [isExpanded, setIsExpanded] = useState(expandByDefault);
    const [header, content] = Children.toArray(childrenProp);

    const contentId = generateUID('collapsible');
    const headerId = generateUID('collapsible');

    const toggle = () => {
        setIsExpanded((prevState) => !prevState);
    };

    const contextValue: CollapsibleContextValue = {
        isExpanded,
        disabled,
        toggle,
        headerId,
        contentId,
    };

    const Element: ElementType = as || defaultElement;

    return (
        <CollapsibleContext.Provider value={contextValue}>
            <Element {...rest}>
                {header}
                {content}
            </Element>
        </CollapsibleContext.Provider>
    );
};
export default Collapsible;
