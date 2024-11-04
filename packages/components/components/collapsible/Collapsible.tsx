import type { ElementType } from 'react';
import { Children, useEffect, useState } from 'react';

import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import generateUID from '@proton/utils/generateUID';

import type { CollapsibleContextValue } from './CollapsibleContext';
import CollapsibleContext from './CollapsibleContext';

interface CollapsibleOwnProps {
    /**
     * Disables the collapsible component
     */
    disabled?: boolean;
    /**
     * Shows content by default if true.
     */
    expandByDefault?: boolean;
    /**
     * If true, the collapsible state can be controlled by the parent component and the expandedByDefault prop.
     */
    externallyControlled?: boolean;
}

type CollapsibleProps<E extends ElementType> = PolymorphicPropsWithoutRef<CollapsibleOwnProps, E>;

const defaultElement = 'div';

const Collapsible = <E extends ElementType = typeof defaultElement>({
    disabled = false,
    expandByDefault = false,
    children: childrenProp,
    externallyControlled = false,
    as,
    ...rest
}: CollapsibleProps<E>) => {
    const [isExpanded, setIsExpanded] = useState(expandByDefault);
    const [header, content] = Children.toArray(childrenProp);

    useEffect(() => {
        if (externallyControlled) {
            setIsExpanded(expandByDefault);
        }
    }, [expandByDefault]);

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
