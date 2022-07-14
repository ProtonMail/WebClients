import { Children, ElementType, useState } from 'react';
import { Box, PolymorphicComponentProps } from 'react-polymorphic-box';

import { generateUID } from '../../helpers';
import CollapsibleContext, { CollapsibleContextValue } from './CollapsibleContext';

export interface CollapsibleOwnProps {
    /**
     * Shows content by default if true.
     */
    expandByDefault?: boolean;
}

export type CollapsibleProps<E extends ElementType> = PolymorphicComponentProps<E, CollapsibleOwnProps>;

const element = 'div';

const Collapsible = <E extends ElementType = typeof element>({
    expandByDefault = false,
    children: childrenProp,
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
        toggle,
        headerId,
        contentId,
    };

    return (
        <CollapsibleContext.Provider value={contextValue}>
            <Box as={element} {...rest}>
                {header}
                {content}
            </Box>
        </CollapsibleContext.Provider>
    );
};
export default Collapsible;
