import { type ComponentPropsWithoutRef, type ElementType, type ReactNode, useRef } from 'react';

import type { VisibilityTrackerOptions } from './types';
import { useVisibilityTracker } from './useVisibilityTracker';

const defaultElement = 'div';
type VisibilityTrackerProps<T extends ElementType = typeof defaultElement> = VisibilityTrackerOptions & {
    as?: T;
    children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'children'>;

/**
 * Tracks when its children enter or exit the viewport using Intersection Observer.
 *
 * @example
 * ```tsx
 * <VisibilityTracker
 *   threshold="half"
 *   marginAroundTarget="100px 0px"
 *   onEnter={() => console.log('entered')}
 *   onExit={() => console.log('exited')}
 *   once={false}
 * >
 *   <img src="…" alt="lazy-loaded image" />
 * </VisibilityTracker>
 * ```
 */
export function VisibilityTracker<T extends ElementType = typeof defaultElement>({
    onEnter,
    onExit,
    threshold = 'half',
    marginAroundTarget,
    once = true,
    as,
    children,
    ...rest
}: VisibilityTrackerProps<T>) {
    const elementRef = useRef<Element>(null);

    useVisibilityTracker(elementRef, {
        onEnter,
        onExit,
        threshold,
        marginAroundTarget,
        once,
    });

    const Element: ElementType = as ?? defaultElement;

    return (
        <Element ref={elementRef} {...rest}>
            {children}
        </Element>
    );
}
