import { useState, useEffect } from 'react';
import { getScrollParent } from '@proton/shared/lib/helpers/dom';

import { debounce } from '@proton/shared/lib/helpers/function';
import { adjustPosition, computedSize, ALL_PLACEMENTS, Position } from './utils';

const getPosition = (
    anchorEl: HTMLElement,
    popperEl: HTMLElement,
    contentAreaEl: HTMLElement,
    originalPlacement: string,
    availablePlacements: string[],
    offset: number,
    originalPosition?: Position
): { position: Position; placement: string } => {
    const anchorRect = anchorEl.getBoundingClientRect();
    const tooltipRect = popperEl.getBoundingClientRect();
    const contentRect = contentAreaEl.getBoundingClientRect();

    const wrapperStyles = window.getComputedStyle(anchorEl);
    const tooltipStyles = window.getComputedStyle(popperEl);

    const normalizedAnchorRect = {
        top: anchorRect.top,
        left: anchorRect.left,
        width: computedSize(wrapperStyles.width, anchorRect.width),
        height: computedSize(wrapperStyles.height, anchorRect.height),
    };

    const normalizedTooltipRect = {
        top: tooltipRect.top,
        left: tooltipRect.left,
        width: computedSize(tooltipStyles.width, tooltipRect.width),
        height: computedSize(tooltipStyles.height, tooltipRect.height),
    };

    const isOutOfBoundsBottom = normalizedAnchorRect.top + normalizedAnchorRect.height - contentRect.top < 0;
    const isOutOfBoundsTop = normalizedAnchorRect.top - (contentRect.top + contentRect.height) > 0;

    if (isOutOfBoundsBottom || isOutOfBoundsTop) {
        return {
            position: {
                top: -9999,
                left: -9999,
                '--arrow-offset': 0,
            },
            placement: 'hidden',
        };
    }

    return adjustPosition(
        normalizedAnchorRect,
        normalizedTooltipRect,
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
    updatePositionOnDOMChange?: boolean;
}

const usePopper = ({
    popperEl,
    anchorEl,
    isOpen = false,
    originalPlacement = 'bottom',
    availablePlacements = ALL_PLACEMENTS,
    originalPosition,
    offset = 10,
    updatePositionOnDOMChange = true,
}: Props) => {
    const initialPosition: Position = { top: -1000, left: -1000, '--arrow-offset': 0 };
    const [placement, setPlacement] = useState(originalPlacement);
    const [position, setPosition] = useState(initialPosition);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const contentArea = getScrollParent(anchorEl);

        const updatePosition = () => {
            if (anchorEl && popperEl) {
                const { placement: adjustedPlacement, position: adjustedPosition } = getPosition(
                    anchorEl,
                    popperEl,
                    contentArea,
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

        const debouncedUpdatePosition = debounce(updatePosition, 100);
        const observer = updatePositionOnDOMChange ? new MutationObserver(debouncedUpdatePosition) : undefined;
        if (observer && popperEl) {
            observer.observe(popperEl, { childList: true, subtree: true });
        }
        contentArea.addEventListener('scroll', debouncedUpdatePosition);
        window.addEventListener('resize', debouncedUpdatePosition);
        return () => {
            if (observer) {
                observer.disconnect();
            }
            contentArea.removeEventListener('scroll', debouncedUpdatePosition);
            window.removeEventListener('resize', debouncedUpdatePosition);
        };
    }, [isOpen, anchorEl, popperEl]);

    return { position, placement };
};

export default usePopper;
