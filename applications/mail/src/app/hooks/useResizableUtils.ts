import { useEffect, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import type React from 'react';

import { useHandler } from '@proton/components';
import useElementRect from '@proton/components/hooks/useElementRect';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import clamp from '@proton/utils/clamp';
import throttle from '@proton/utils/throttle';

import { ResizeHandlePosition } from 'proton-mail/components/list/ResizeHandle';

/**
 * Base options for resizable components
 */
export interface ResizableOptions {
    /**
     * Minimum width of the container in pixels
     * @default 280
     */
    minWidth?: number;

    /**
     * Maximum ratio of the resizable area to the container width
     * @default 0.6
     */
    maxRatio?: number;

    /**
     * Key to use for persisting width in localStorage
     * If provided, width will be saved and restored across sessions
     */
    persistKey?: string;

    /**
     * Default ratio of the resizable area to the container width
     * Used when persistKey is provided for ratio-based persistence
     * @default 0.35
     */
    defaultRatio?: number;

    /**
     * Reference to the container element used for size observation and ratio calculations.
     * maxRatio and defaultRatio will be calculated relative to this container's width.
     * This provides precise control and prevents visual jumps.
     *
     * @example
     * ```tsx
     * const containerRef = useRef<HTMLDivElement>(null);
     *
     * <div ref={containerRef} className="my-container">
     *   <ResizableWrapper
     *     containerRef={containerRef}
     *     maxRatio={0.5} // 50% of container width
     *   >
     *     <MyContent />
     *   </ResizableWrapper>
     * </div>
     * ```
     */
    containerRef: React.RefObject<HTMLElement>;
}

interface UseResizableOptions extends ResizableOptions {
    /**
     * Reference to the resizable wrapper element
     */
    resizableWrapperRef: RefObject<HTMLDivElement>;

    /**
     * Optional reference to inner content element for scrollbar width measurement
     */
    innerContentRef?: RefObject<HTMLDivElement>;

    /**
     * Direction of resize
     * @default ResizeHandlePosition.RIGHT
     */
    position?: ResizeHandlePosition;
}

const memoryCache: Record<string, string> = {};

export const resetMemoryCacheForTesting = () => {
    Object.keys(memoryCache).forEach((key) => {
        delete memoryCache[key];
    });
};

/**
 * Utility function to calculate the scrollbar width for an element.
 * This is shared across all resizable components to ensure consistent calculation.
 * @param container - The container element that may have scrollbars
 * @param content - The content element inside the container
 * @returns The width of the scrollbar in pixels
 */
export const calculateScrollBarWidth = (container: HTMLElement, content: HTMLElement): number => {
    if (!container || !content) {
        return 0;
    }

    const containerWidth = container.getBoundingClientRect().width;
    const contentWidth = content.getBoundingClientRect().width;
    const scrollbarWidth = containerWidth - contentWidth;

    return scrollbarWidth > 0 ? scrollbarWidth : 0;
};

/**
 * Get a value from localStorage
 * @param persistKey - localStorage key
 * @returns Stored value or null if not found
 */
export const getPersistedValue = (persistKey: string): string | null => {
    if (!persistKey) {
        return null;
    }

    if (memoryCache[persistKey] !== undefined) {
        return memoryCache[persistKey];
    }

    const value = getItem(persistKey);

    if (value !== undefined && value !== null) {
        memoryCache[persistKey] = value;
    }

    return value ?? null;
};

/**
 * Save a value to localStorage
 * @param value - Value to store
 * @param persistKey - localStorage key
 */
export const setPersistedValue = (value: string, persistKey: string): void => {
    if (!persistKey) {
        return;
    }

    memoryCache[persistKey] = value;
    setItem(persistKey, value);
};

/**
 * Calculate width from a saved ratio if available and valid
 * @param persistKey - localStorage key to check for saved ratio
 * @param containerWidth - Current container width
 * @returns Width calculated from saved ratio, or null if no valid saved ratio
 */
const calculateWidthFromSavedRatio = (persistKey: string | undefined, containerWidth: number): number | null => {
    if (!persistKey || containerWidth <= 0) {
        return null;
    }

    const savedRatio = getPersistedValue(persistKey);
    if (!savedRatio) {
        return null;
    }

    const ratio = parseFloat(savedRatio);
    if (isNaN(ratio)) {
        return null;
    }

    return containerWidth * ratio;
};

/**
 * Apply width constraints (min width and max ratio)
 * @param width - Width to constrain
 * @param containerWidth - Container width for ratio calculation
 * @param minWidth - Minimum allowed width
 * @param maxRatio - Maximum ratio of container width
 * @returns Constrained width
 */
const constrainWidth = (width: number, containerWidth: number, minWidth: number, maxRatio: number): number => {
    const maxWidthFromRatio = containerWidth * maxRatio;
    return clamp(width, minWidth, maxWidthFromRatio);
};

/**
 * Save width as a ratio in localStorage
 * @param width - Width to save as ratio
 * @param containerWidth - Container width for ratio calculation
 * @param persistKey - localStorage key
 */
const saveWidthAsRatio = (width: number, containerWidth: number, persistKey: string | undefined): void => {
    if (!persistKey || containerWidth <= 0) {
        return;
    }

    const ratio = width / containerWidth;
    setPersistedValue(ratio.toString(), persistKey);
};

/**
 * Calculate the target width considering saved ratio, default ratio, and constraints
 * @param persistKey - localStorage key for saved ratio
 * @param containerWidth - Current container width
 * @param defaultRatio - Default ratio to use if no saved ratio
 * @param minWidth - Minimum allowed width
 * @param maxRatio - Maximum ratio of container width
 * @returns Calculated and constrained target width
 */
const getTargetWidth = (
    persistKey: string | undefined,
    containerWidth: number,
    defaultRatio: number,
    minWidth: number,
    maxRatio: number
): number => {
    // Try to get width from saved ratio first
    const savedWidth = calculateWidthFromSavedRatio(persistKey, containerWidth);
    const targetWidth = savedWidth ?? containerWidth * defaultRatio;

    return constrainWidth(targetWidth, containerWidth, minWidth, maxRatio);
};

/**
 * Default minimum width of the resizable area - it is kept 360 for the list of emails.
 *
 * IMPORTANT: Always use this constant instead of hardcoding 360px values.
 * This ensures consistency across all resizable mail components and makes
 * future width adjustments centralized and maintainable.
 *
 * @default 360
 */
export const DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST = 360;

/**
 * Default maximum ratio of the resizable area to the container width.
 * @default 0.6
 */
export const DEFAULT_MAX_RATIO_OF_MAILBOX_LIST_AREA = 0.6;

/**
 * Default ratio of the resizable area to the container width.
 * @default 0.35
 */
export const DEFAULT_RATIO_OF_MAILBOX_LIST = 0.35;

/**
 * A hook that provides resizing functionality with persistence and constraints.
 *
 * Features:
 * - Container-based ratio calculations
 * - Smooth initialization without visual jumps
 * - Width persistence across sessions
 * - Responsive behavior based on container changes
 *
 * @param options - Configuration options for the resizable component
 * @returns Object containing width, resize state, and control functions
 */
export const useResizableUtils = ({
    resizableWrapperRef,
    innerContentRef,
    minWidth = DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST,
    maxRatio = DEFAULT_MAX_RATIO_OF_MAILBOX_LIST_AREA,
    position = ResizeHandlePosition.RIGHT,
    persistKey,
    defaultRatio = DEFAULT_RATIO_OF_MAILBOX_LIST,
    containerRef,
}: UseResizableOptions) => {
    const [isResizing, setIsResizing] = useState(false);
    const [scrollBarWidth, setScrollBarWidth] = useState(0);

    // Use useElementRect to observe container size changes
    const containerRect = useElementRect(containerRef);
    const containerWidth = containerRect?.width || 0;
    const [hasCalculatedInitialWidth, setHasCalculatedInitialWidth] = useState(false);

    const [width, setWidthInternal] = useState(() => {
        return calculateWidthFromSavedRatio(persistKey, containerWidth) ?? minWidth;
    });

    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    const setWidth = (newWidth: number) => {
        setWidthInternal(newWidth);
    };

    useLayoutEffect(() => {
        if (containerWidth <= 0) {
            return;
        }

        const targetWidth = getTargetWidth(persistKey, containerWidth, defaultRatio, minWidth, maxRatio);
        const shouldUpdate = !hasCalculatedInitialWidth || Math.abs(width - targetWidth) > 5;

        if (shouldUpdate) {
            setWidth(targetWidth);
            if (!hasCalculatedInitialWidth) {
                setHasCalculatedInitialWidth(true);
            }
        }
    }, [containerWidth, hasCalculatedInitialWidth]);

    const safeSaveRatio = useHandler(
        (newWidth: number) => {
            saveWidthAsRatio(newWidth, containerWidth, persistKey);
        },
        { debounce: 1000 }
    );

    const updateWidth = (newWidth: number) => {
        const constrainedWidth = constrainWidth(newWidth, containerWidth, minWidth, maxRatio);
        setWidth(constrainedWidth);

        safeSaveRatio(constrainedWidth);
        return constrainedWidth;
    };

    const handleResizeWithMouse = (e: MouseEvent) => {
        if (!isResizing || !resizableWrapperRef.current) {
            return;
        }

        let newWidth: number;

        switch (position) {
            case ResizeHandlePosition.LEFT:
                newWidth = startWidth - (e.clientX - startX);
                break;
            case ResizeHandlePosition.RIGHT:
            default:
                newWidth = startWidth + (e.clientX - startX);
        }

        const constrainedWidth = constrainWidth(newWidth, containerWidth, minWidth, maxRatio);
        setWidth(constrainedWidth);

        safeSaveRatio(constrainedWidth);
    };

    const enableResize = (e: React.MouseEvent) => {
        if (!resizableWrapperRef.current) {
            return;
        }

        setIsResizing(true);
        setStartWidth(width);
        setStartX(e.clientX);
        document.body.style.cursor = 'col-resize';

        document.body.classList.add('cursor-col-resize');

        resizableWrapperRef.current.classList.add('user-select-none');
    };

    const disableResize = () => {
        if (!isResizing || !resizableWrapperRef.current) {
            return;
        }

        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.classList.remove('cursor-col-resize');
        resizableWrapperRef.current.classList.remove('user-select-none');
    };

    const resetWidth = () => {
        const defaultWidth = constrainWidth(containerWidth * defaultRatio, containerWidth, minWidth, maxRatio);
        updateWidth(defaultWidth);
    };

    useEffect(() => {
        const resizeThrottle = throttle(handleResizeWithMouse, 16);

        if (isResizing) {
            document.addEventListener('mousemove', resizeThrottle);
            document.addEventListener('mouseup', disableResize);
            document.addEventListener('mouseleave', disableResize);
        }

        return () => {
            document.removeEventListener('mousemove', resizeThrottle);
            document.removeEventListener('mouseup', disableResize);
            document.removeEventListener('mouseleave', disableResize);
        };
    }, [isResizing, handleResizeWithMouse, disableResize]);

    const debouncedCalculateScrollBarWidth = useHandler(
        () => {
            if (resizableWrapperRef.current && innerContentRef?.current) {
                const calculatedWidth = calculateScrollBarWidth(resizableWrapperRef.current, innerContentRef.current);
                setScrollBarWidth(calculatedWidth);
            }
        },
        { debounce: 100 }
    );

    useEffect(() => {
        debouncedCalculateScrollBarWidth();

        return () => {
            debouncedCalculateScrollBarWidth.cancel?.();
        };
    }, [debouncedCalculateScrollBarWidth, width]);

    // Handle container size changes - useElementRect already observes the container
    useEffect(() => {
        const savedWidth = calculateWidthFromSavedRatio(persistKey, containerWidth);
        if (savedWidth !== null) {
            const constrainedWidth = constrainWidth(savedWidth, containerWidth, minWidth, maxRatio);
            setWidth(constrainedWidth);
        }
    }, [containerWidth, persistKey, maxRatio, minWidth]);

    return {
        width,
        isResizing,
        enableResize,
        disableResize,
        resetWidth,
        updateWidth,
        scrollBarWidth,
    };
};
