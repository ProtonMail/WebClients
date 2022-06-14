import { ElementType, useContext } from 'react';
import { Box, PolymorphicComponentProps } from 'react-polymorphic-box';
import CollapsibleContext from './CollapsibleContext';

export interface CollapsibleContentOwnProps {}

export type CollapsibleContentProps<E extends ElementType> = PolymorphicComponentProps<E, CollapsibleContentOwnProps>;

const element = 'div';

const CollapsibleContent = <E extends ElementType = typeof element>(props: CollapsibleContentProps<E>) => {
    const { isExpanded, contentId, headerId } = useContext(CollapsibleContext);

    return (
        <Box
            as={element}
            {...props}
            id={contentId}
            role="region"
            aria-labelledby={headerId}
            hidden={!isExpanded}
            aria-hidden={!isExpanded}
            data-testid="collapsible-content"
        />
    );
};
export default CollapsibleContent;
