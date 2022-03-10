import { Ref, useEffect, useRef, useState } from 'react';

import { classnames } from '../../helpers';
import './Scroll.scss';
import { useCombinedRefs } from '../../hooks';

const TOLERANCE = 4;

interface ScrollProps extends React.ComponentPropsWithoutRef<'div'> {
    horizontal?: boolean;
    setHasScrollShadow?: (hasScrollShadow: boolean) => void;
    customContainerRef?: Ref<HTMLElement>;
}

const Scroll = ({ children, horizontal, setHasScrollShadow, className, customContainerRef, ...rest }: ScrollProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollChildRef = useRef<HTMLDivElement>(null);
    const [showStartShadow, setShowStartShadow] = useState(false);
    const [showEndShadow, setShowEndShadow] = useState(false);

    const containersRefs = customContainerRef
        ? [scrollContainerRef, customContainerRef as Ref<HTMLDivElement>]
        : [scrollContainerRef];
    const containerRefs = useCombinedRefs(...containersRefs);

    useEffect(() => {
        setHasScrollShadow?.(showStartShadow);
    }, [showStartShadow]);

    const setShadows = (container: HTMLDivElement, child: HTMLDivElement) => {
        if (!container || !child) {
            return;
        }

        const containerRect = container.getBoundingClientRect();

        const childRect = child.getBoundingClientRect();

        const isOnStartEdge = horizontal
            ? containerRect.left - childRect.left < TOLERANCE
            : containerRect.top - childRect.top < TOLERANCE;

        const isOnEndEdge = horizontal
            ? childRect.right - containerRect.right < TOLERANCE
            : childRect.bottom - containerRect.bottom < TOLERANCE;

        /*
         * We're passing a callback here so that we can have access to the previous
         * respective show shadow value. If we reference "showStartShadow" or
         * "showEndShadow" directly here, we run into a stale closure issue because
         * "setShadows" is passed to the resize observer in the useEffect below.
         *
         * I was cautious at first because I was afraid that calling useState's set
         * functions every time like this just to receive access to the real previous
         * state value might have some negative impact on rendering performance. However,
         * useState seems to internally handle reference equality comparison optimizations.
         * These setState's do not trigger re-renders if they return the exact same value
         * as what was already set.
         *
         * This is mostly an effort to be able to re-use only one resize observer.
         * An alternative would've been to clean up and re-create a resize observer in the
         * useEffect below, passing setShadows (wrapped in useCallback that is) into the
         * dependency array, but I thought this would be the cleaner solution, albeit a bit
         * weird imo.
         */
        setShowStartShadow((previousShowStartShadow) =>
            isOnStartEdge === previousShowStartShadow ? !previousShowStartShadow : previousShowStartShadow
        );

        setShowEndShadow((previousShowEndShadow) =>
            isOnEndEdge === previousShowEndShadow ? !previousShowEndShadow : previousShowEndShadow
        );
    };

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            setShadows(scrollContainerRef.current!, scrollChildRef.current!);
        });

        resizeObserver.observe(scrollChildRef.current!);

        resizeObserver.observe(scrollContainerRef.current!);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const handleScroll = ({ currentTarget: scrollContainer }: React.UIEvent<HTMLDivElement, UIEvent>) => {
        const { current: scrollChild } = scrollChildRef;

        /*
         * safeguard if scrollChild hasn't mounted inside the dom yet
         * impossible case I think, since they would render together
         * and a scroll event could only trigger after they are physically
         * mounted, ts doesn't know this though
         */
        if (!scrollChild) {
            return;
        }

        setShadows(scrollContainer, scrollChild);
    };

    const outerClassName = classnames([className, horizontal ? 'scroll-outer-horizontal' : 'scroll-outer-vertical']);

    const startShadowClassName = classnames([
        'scroll-start-shadow no-pointer-events',
        showStartShadow && 'scroll-start-shadow-visible',
    ]);
    const endShadowClassName = classnames([
        'scroll-end-shadow no-pointer-events',
        showEndShadow && 'scroll-end-shadow-visible',
    ]);

    return (
        <div {...rest} className={outerClassName}>
            <div className={startShadowClassName} aria-hidden="true" />
            <div className={endShadowClassName} aria-hidden="true" />
            <div className="scroll-inner" ref={containerRefs} onScroll={handleScroll}>
                <div className="scroll-child" ref={scrollChildRef}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Scroll;
