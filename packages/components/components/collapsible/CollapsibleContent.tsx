import type { ElementType } from 'react';
import { useContext } from 'react';

import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

import CollapsibleContext from './CollapsibleContext';

import './CollapsibleContent.scss';

interface CollapsibleContentOwnProps {
    /**
     * Animate expand/collapse with a smooth height transition (`grid-template-rows: 0fr → 1fr`)
     * instead of instantly toggling `hidden`.
     */
    animated?: boolean;
}

type CollapsibleContentProps<E extends ElementType> = PolymorphicPropsWithoutRef<CollapsibleContentOwnProps, E>;

const defaultElement = 'div';

const CollapsibleContent = <E extends ElementType = typeof defaultElement>({
    as,
    animated = false,
    className,
    children,
    ...rest
}: CollapsibleContentProps<E>) => {
    const { isExpanded, contentId, headerId } = useContext(CollapsibleContext);
    const Element: ElementType = as || defaultElement;

    const stateProps = {
        role: 'region',
        'aria-labelledby': headerId,
        'aria-hidden': !isExpanded,
        ...(animated
            ? {
                  className: clsx('collapsible-content-animated', className),
                  'data-state': isExpanded ? 'open' : 'closed',
                  ...(isExpanded ? {} : { inert: '' }),
              }
            : { className, hidden: !isExpanded }),
    };

    return (
        <Element {...rest} {...stateProps} id={contentId} data-testid="collapsible-content">
            {animated ? <div className="overflow-hidden">{children}</div> : children}
        </Element>
    );
};
export default CollapsibleContent;
