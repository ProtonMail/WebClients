import { useState, useEffect } from 'react';
import { getScrollParent } from 'proton-shared/lib/helpers/dom';

import { adjustPosition, computedSize, ALL_PLACEMENTS, Position } from './utils';

const getPosition = (
    anchorEl: HTMLElement,
    popperEl: HTMLElement,
    originalPlacement: string,
    availablePlacements: string[],
    offset: number,
    originalPosition?: Position
) => {
    const wrapperBounds = anchorEl.getBoundingClientRect();
    const tooltipBounds = popperEl.getBoundingClientRect();

    const wrapperStyles = window.getComputedStyle(anchorEl);
    const tooltipStyles = window.getComputedStyle(popperEl);

    return adjustPosition(
        {
            top: wrapperBounds.top,
            left: wrapperBounds.left,
            width: computedSize(wrapperStyles.width, wrapperBounds.width),
            height: computedSize(wrapperStyles.height, wrapperBounds.height),
        },
        {
            top: tooltipBounds.top,
            left: tooltipBounds.left,
            width: computedSize(tooltipStyles.width, tooltipBounds.width),
            height: computedSize(tooltipStyles.height, tooltipBounds.height),
        },
        originalPlacement,
        offset,
        originalPosition,
        availablePlacements
    );
};

interface Props {
    popperEl?: HTMLElement | null;
    anchorEl?: HTMLElement | null;
    isOpen?: boolean;
    originalPlacement?: string;
    availablePlacements?: string[];
    originalPosition?: Position;
    offset?: number;
}

const usePopper = ({
    popperEl,
    anchorEl,
    isOpen = false,
    originalPlacement = 'bottom',
    availablePlacements = ALL_PLACEMENTS,
    originalPosition,
    offset = 10,
}: Props) => {
    const initialPosition = { top: -1000, left: -1000 };
    const [placement, setPlacement] = useState(originalPlacement);
    const [position, setPosition] = useState(initialPosition);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const updatePosition = () => {
            if (anchorEl && popperEl) {
                const { placement: adjustedPlacement, position: adjustedPosition } = getPosition(
                    anchorEl,
                    popperEl,
                    originalPlacement,
                    availablePlacements,
                    offset,
                    originalPosition
                );
                setPlacement(adjustedPlacement);
                setPosition(adjustedPosition);
                return;
            }

            setPlacement(originalPlacement);
            setPosition(initialPosition);
        };

        updatePosition();

        const contentArea = getScrollParent(anchorEl);

        contentArea.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);
        return () => {
            contentArea.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, anchorEl, popperEl]);

    return { position, placement };
};

export default usePopper;
