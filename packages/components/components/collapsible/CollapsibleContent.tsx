import type { ElementType } from 'react';
import { useContext } from 'react';

import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';

import CollapsibleContext from './CollapsibleContext';

interface CollapsibleContentOwnProps {}

type CollapsibleContentProps<E extends ElementType> = PolymorphicPropsWithoutRef<CollapsibleContentOwnProps, E>;

const defaultElement = 'div';

const CollapsibleContent = <E extends ElementType = typeof defaultElement>({
    as,
    ...rest
}: CollapsibleContentProps<E>) => {
    const { isExpanded, contentId, headerId } = useContext(CollapsibleContext);
    const Element: ElementType = as || defaultElement;

    return (
        <Element
            {...rest}
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
