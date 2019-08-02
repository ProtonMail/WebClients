import { useRef, useState, useEffect } from 'react';
import { calculateAdjustedPosition } from './utils';

const computedSize = (stylePixels, boundsSize) => {
    const computedStyleSize = Number(stylePixels.replace('px', ''));
    return isNaN(computedStyleSize) ? boundsSize : computedStyleSize;
};

/**
 * Available placements: bottom-left, bottom, bottom-right, top-left, top, top-right, left, right
 */
const usePopper = ({ placement = 'bottom', visible: visibleInitially = false, scrollContainerClass, offset }) => {
    const tooltipRef = useRef();
    const wrapperRef = useRef();
    const [visible, setVisible] = useState(visibleInitially);
    const [position, setPosition] = useState({ top: -1000, left: -1000, placement });

    useEffect(() => {
        const updatePosition = () => {
            if (visible && wrapperRef.current && tooltipRef.current) {
                const wrapperBounds = wrapperRef.current.getBoundingClientRect();
                const tooltipBounds = tooltipRef.current.getBoundingClientRect();
                const wrapperStyles = window.getComputedStyle(wrapperRef.current);
                const tooltipStyles = window.getComputedStyle(tooltipRef.current);
                setPosition(
                    calculateAdjustedPosition(
                        {
                            top: wrapperBounds.top,
                            left: wrapperBounds.left,
                            width: computedSize(wrapperStyles.width, wrapperBounds.width),
                            height: computedSize(wrapperStyles.height, wrapperBounds.height)
                        },
                        {
                            top: tooltipBounds.top,
                            left: tooltipBounds.left,
                            width: computedSize(tooltipStyles.width, tooltipBounds.width),
                            height: computedSize(tooltipStyles.height, tooltipBounds.height)
                        },
                        placement,
                        offset
                    )
                );
            } else {
                setPosition({ top: -1000, left: -1000, placement });
            }
        };

        updatePosition();

        if (visible) {
            const contentArea = document.getElementsByClassName(scrollContainerClass)[0] || document.body;
            contentArea.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
            return () => {
                contentArea.removeEventListener('scroll', updatePosition);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [visible, wrapperRef.current, tooltipRef.current]);

    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    return { position, visible, show, hide, tooltipRef, wrapperRef };
};

export default usePopper;
