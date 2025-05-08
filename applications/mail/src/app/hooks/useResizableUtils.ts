import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type React from 'react';

import { useDrawer, useHandler, useWindowSize } from '@proton/components';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
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
     * Maximum ratio of the container width to window width
     * @default 0.6
     */
    maxRatio?: number;

    /**
     * Key to use for persisting width in localStorage
     * If provided, width will be saved and restored across sessions
     */
    persistKey?: string;

    /**
     * Alternative key for localStorage when drawer is open
     * Only used if both persistKey and drawerKey are provided
     */
    drawerKey?: string;

    /**
     * Default ratio of container width to window width
     * Used when persistKey is provided for ratio-based persistence
     * @default 0.35
     */
    defaultRatio?: number;
}

interface UseResizableOptions extends ResizableOptions {
    /**
     * Reference to the container element
     */
    containerRef: RefObject<HTMLDivElement>;

    /**
     * Optional reference to measure for scrollbar width
     */
    contentRef?: RefObject<HTMLDivElement>;

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

const getActiveKey = (persistKey: string, drawerKey?: string, isDrawerOpen?: boolean): string =>
    isDrawerOpen && drawerKey ? drawerKey : persistKey;

/**
 * Get a value from localStorage based on drawer state
 * @param persistKey - Primary localStorage key
 * @param drawerKey - Alternative key for when drawer is open
 * @param isDrawerOpen - Whether drawer is in view
 * @returns Stored value or null if not found
 */
export const getPersistedValue = (persistKey: string, drawerKey?: string, isDrawerOpen?: boolean): string | null => {
    if (!persistKey) {
        return null;
    }

    const activeKey = getActiveKey(persistKey, drawerKey, isDrawerOpen);

    if (memoryCache[activeKey] !== undefined) {
        return memoryCache[activeKey];
    }

    const value = getItem(activeKey);

    if (value !== undefined && value !== null) {
        memoryCache[activeKey] = value;
    }

    return value ?? null;
};

/**
 * Save a value to localStorage based on drawer state
 * @param value - Value to store
 * @param persistKey - Primary localStorage key
 * @param drawerKey - Alternative key for when drawer is open
 * @param isDrawerOpen - Whether drawer is in view
 */
export const setPersistedValue = (
    value: string,
    persistKey: string,
    drawerKey?: string,
    isDrawerOpen?: boolean
): void => {
    if (!persistKey) {
        return;
    }

    const activeKey = getActiveKey(persistKey, drawerKey, isDrawerOpen);

    memoryCache[activeKey] = value;

    if (isDrawerOpen && drawerKey) {
        setItem(drawerKey, value);
    } else {
        setItem(persistKey, value);
    }
};

/**
 * Default minimum width of the resizable area - it is kept 360 for the list of emails.
 * @default 360
 */
export const DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST = 360;

/**
 * This value is for the resizable area of the list of emails. The maximum ratio of the resizable area to the window width.
 * @default 0.6
 */
export const DEFAULT_MAX_RATIO_OF_MAILBOX_LIST_AREA = 0.6;

/**
 * The main use case of this value is for list of emails that can be resized. Approximately 35% of the window width is the default.
 * @default 0.35
 */
export const DEFAULT_RATIO_OF_MAILBOX_LIST = 0.35;

/**
 * A hook that provides resizing functionality with persistence and constraints.
 *
 * @param options - Configuration options for the resizable component
 *
 */
export const useResizableUtils = ({
    containerRef,
    contentRef,
    minWidth = DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST,
    maxRatio = DEFAULT_MAX_RATIO_OF_MAILBOX_LIST_AREA,
    position = ResizeHandlePosition.RIGHT,
    persistKey,
    drawerKey,
    defaultRatio = DEFAULT_RATIO_OF_MAILBOX_LIST,
}: UseResizableOptions) => {
    const { appInView } = useDrawer();
    const isDrawerOpen = Boolean(appInView);
    const [isResizing, setIsResizing] = useState(false);
    const [scrollBarWidth, setScrollBarWidth] = useState(0);

    const [windowWidth] = useWindowSize();

    const [width, setWidth] = useState(() => {
        if (persistKey) {
            try {
                const key = drawerKey && isDrawerOpen ? drawerKey : persistKey;
                const savedValue = getPersistedValue(key);

                if (savedValue) {
                    const parsedWidth = parseFloat(savedValue);
                    if (!isNaN(parsedWidth)) {
                        // Convert ratio to absolute width
                        return Math.min(windowWidth * parsedWidth, windowWidth * maxRatio);
                    }
                }
            } catch (e) {
                console.warn('Error reading from localStorage during initialization:', e);
            }
        }
        return windowWidth * defaultRatio;
    });

    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    useEffect(() => {
        if (persistKey) {
            const savedRatio = getPersistedValue(persistKey, drawerKey, isDrawerOpen);
            if (savedRatio) {
                const ratio = parseFloat(savedRatio);
                if (!isNaN(ratio)) {
                    const newWidth = windowWidth * ratio;
                    const maxWidthFromRatio = windowWidth * maxRatio;
                    setWidth(Math.max(minWidth, Math.min(maxWidthFromRatio, newWidth)));
                }
            } else if (defaultRatio) {
                setWidth(windowWidth * defaultRatio);
            }
        }
    }, [windowWidth, isDrawerOpen]);

    const safeSaveRatio = useHandler(
        (newWidth: number) => {
            if (persistKey) {
                const newRatio = newWidth / windowWidth;
                setPersistedValue(newRatio.toString(), persistKey, drawerKey, isDrawerOpen);
            }
        },
        { debounce: 1000 }
    );

    const updateWidth = (newWidth: number) => {
        const maxWidthFromRatio = windowWidth * maxRatio;
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidthFromRatio, newWidth));
        setWidth(constrainedWidth);

        safeSaveRatio(constrainedWidth);
        return constrainedWidth;
    };

    const handleResizeWithMouse = (e: MouseEvent) => {
        if (!isResizing || !containerRef.current) {
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

        const maxWidthFromRatio = windowWidth * maxRatio;
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidthFromRatio, newWidth));
        setWidth(constrainedWidth);

        safeSaveRatio(constrainedWidth);
    };

    /**
     * Enable resize on mousedown
     * @param e - Mouse event
     * @returns void
     *
     * @description
     * When resizing, we add certain styles to the area and change the cursor style to let the user know.
     */
    const enableResize = (e: React.MouseEvent) => {
        if (!containerRef.current) {
            return;
        }

        setIsResizing(true);
        setStartWidth(width);
        setStartX(e.clientX);
        document.body.style.cursor = 'col-resize';

        document.body.classList.add('cursor-col-resize');

        containerRef.current.classList.add('user-select-none');
    };

    const disableResize = () => {
        if (!isResizing || !containerRef.current) {
            return;
        }

        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.classList.remove('cursor-col-resize');
        containerRef.current.classList.remove('user-select-none');
    };

    const resetWidth = () => {
        const defaultWidth = windowWidth * defaultRatio;
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
            if (containerRef.current && contentRef?.current) {
                const calculatedWidth = calculateScrollBarWidth(containerRef.current, contentRef.current);
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
    }, [debouncedCalculateScrollBarWidth, width, windowWidth]);

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
