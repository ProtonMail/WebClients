import { useState, useEffect } from 'react';
import { adjustPosition, computedSize, ALL_PLACEMENTS } from './utils';

const usePopper = (
    popperRef,
    anchorRef,
    visible,
    {
        originalPlacement = 'bottom',
        availablePlacements = ALL_PLACEMENTS,
        offset = 10,
        scrollContainerClass = null
    } = {}
) => {
    const [placement, setPlacement] = useState(originalPlacement);
    const [position, setPosition] = useState({ top: -1000, left: -1000 });

    useEffect(() => {
        const updatePosition = () => {
            if (visible && anchorRef.current && popperRef.current) {
                const wrapperBounds = anchorRef.current.getBoundingClientRect();
                const tooltipBounds = popperRef.current.getBoundingClientRect();
                const wrapperStyles = window.getComputedStyle(anchorRef.current);
                const tooltipStyles = window.getComputedStyle(popperRef.current);
                const { placement: adjustedPlacement, position: adjustedPosition } = adjustPosition(
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
                    originalPlacement,
                    offset,
                    availablePlacements
                );
                setPlacement(adjustedPlacement);
                setPosition(adjustedPosition);
            } else {
                setPlacement(originalPlacement);
                setPosition({ top: -1000, left: -1000 });
            }
        };

        updatePosition();

        if (visible) {
            const contentArea =
                (scrollContainerClass && document.getElementsByClassName(scrollContainerClass)[0]) || document.body;
            contentArea.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
            return () => {
                contentArea.removeEventListener('scroll', updatePosition);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [visible, anchorRef.current, popperRef.current]);

    return { position, placement };
};

export default usePopper;
