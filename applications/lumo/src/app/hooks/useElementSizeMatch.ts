import type { RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';

/**
 * Checks whether an element's size satisfies a predicate, independently of the viewport size.
 * Evaluates when observation starts and whenever ResizeObserver reports a border-box resize.
 *
 * @param elementRef - Ref to the element to measure.
 * @param evaluate - Predicate receiving the element's current bounding rectangle, in CSS pixels.
 * @returns The latest predicate result, or false until the first measurement.
 *
 * @example
 * const isSmallWidth = useElementSizeMatch(containerRef, ({ width }) => width <= 400);
 */
export const useElementSizeMatch = (
    elementRef: RefObject<HTMLElement>,
    evaluate: (rect: DOMRectReadOnly) => boolean
) => {
    const [conditionMet, setConditionMet] = useState(false);

    useLayoutEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const update = () => setConditionMet(evaluate(element.getBoundingClientRect()));
        const observer = new ResizeObserver(update);
        observer.observe(element, { box: 'border-box' });
        update();

        return () => observer.disconnect();
    }, [elementRef, evaluate]);

    return conditionMet;
};
