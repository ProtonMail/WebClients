import { useRef, useState } from 'react';

import { classnames } from '../../helpers';
import './Scroll.scss'

const TOLERANCE = 4;

interface ScrollProps extends React.ComponentPropsWithoutRef<'div'> {
    horizontal?: boolean;
}

const Scroll = ({ children, horizontal, className, ...rest }: ScrollProps) => {
    const scrollContainerRef = useRef<null | HTMLDivElement>(null);
    const scrollChildRef = useRef<null | HTMLDivElement>(null);
    const [showStartShadow, setShowStartShadow] = useState(false);
    const [showEndShadow, setShowEndShadow] = useState(false);

    const setShadows = (container: HTMLDivElement, child: HTMLDivElement) => {
        const containerRect = container.getBoundingClientRect();

        const childRect = child.getBoundingClientRect();

        const isOnStartEdge = horizontal
            ? containerRect.left - childRect.left < TOLERANCE
            : containerRect.top - childRect.top < TOLERANCE;

        const isOnEndEdge = horizontal
            ? childRect.right - containerRect.right < TOLERANCE
            : childRect.bottom - containerRect.bottom < TOLERANCE;

        if (isOnStartEdge === showStartShadow) {
            setShowStartShadow(!isOnStartEdge);
        }

        if (isOnEndEdge === showEndShadow) {
            setShowEndShadow(!isOnEndEdge);
        }
    };

    const setScrollContainerRef = (node: HTMLDivElement) => {
        if (!node) {
            return;
        }

        scrollContainerRef.current = node;

        if (scrollChildRef.current) {
            setShadows(scrollContainerRef.current, scrollChildRef.current);
        }
    };

    const setScrollChildRef = (node: HTMLDivElement) => {
        if (!node) {
            return;
        }

        scrollChildRef.current = node;

        if (scrollContainerRef.current) {
            setShadows(scrollContainerRef.current, scrollChildRef.current);
        }
    };

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

    const outerClassName = classnames([ className, horizontal ? 'scroll-outer-horizontal' : 'scroll-outer-vertical' ]);
    const startShadowClassName = classnames(['no-pointer-events', showStartShadow && 'scroll-start-shadow']);
    const endShadowClassName = classnames(['no-pointer-events', showEndShadow && 'scroll-end-shadow']);

    return (
        <div {...rest} className={outerClassName}>
            <div className={startShadowClassName} aria-hidden="true" />
            <div className={endShadowClassName} aria-hidden="true" />
            <div className="scroll-inner" ref={setScrollContainerRef} onScroll={handleScroll}>
                <div className="scroll-child" ref={setScrollChildRef}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Scroll;
