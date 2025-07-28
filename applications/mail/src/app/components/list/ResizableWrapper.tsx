import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import type { ResizableOptions } from '../../hooks/useResizableUtils';
import {
    DEFAULT_MAX_RATIO_OF_MAILBOX_LIST_AREA,
    DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST,
    DEFAULT_RATIO_OF_MAILBOX_LIST,
    useResizableUtils,
} from '../../hooks/useResizableUtils';
import { ResizeHandle, ResizeHandlePosition } from './ResizeHandle';

/**
 * @module ResizableWrapper
 *
 * A component that wraps content and makes it resizable with drag handles.
 * This component provides a complete solution for creating resizable panels with:
 * - Configurable resize handles (left/right/both)
 * - Width constraints (min/max)
 * - Width persistence across sessions
 * - Container-based ratio calculations
 * - Responsive behavior based on container size
 * - Smooth initialization without visual jumps
 *
 * @example
 * ```tsx
 * // Basic usage
 * const containerRef = useRef<HTMLDivElement>(null);
 *
 * <div ref={containerRef}>
 *   <ResizableWrapper
 *     containerRef={containerRef}
 *     minWidth={280}
 *     maxRatio={0.6}
 *     resizeHandlePosition={ResizeHandlePosition.RIGHT}
 *   >
 *     <YourContent />
 *   </ResizableWrapper>
 * </div>
 *
 * // With persistence
 * <ResizableWrapper
 *   containerRef={containerRef}
 *   persistKey="myPanelWidth"
 *   defaultRatio={0.35}
 * >
 *   <YourContent />
 * </ResizableWrapper>
 * ```
 */

interface ResizableWrapperProps extends ResizableOptions {
    children: ReactNode;
    className?: string;
    /**
     * Position of the resize handle
     * @default RIGHT
     */
    resizeHandlePosition?: ResizeHandlePosition;
    /**
     * Callback when width changes
     */
    onWidthChange?: (width: number) => void;
    /**
     * Callback when resizing state changes
     */
    onResizingChange?: (isResizing: boolean) => void;
    /**
     * Optional external ref for the resize handle
     * Useful when integrating with existing context providers
     */
    resizeHandleRef?: React.RefObject<HTMLButtonElement>;
    /**
     * Force disable resizing. e.g. when you want to force row mode. When true, disables resizing and renders children directly.
     * @default false
     */
    resizingDisabled?: boolean;
}

/**
 * A component that wraps content and provides resize functionality.
 *
 * ResizableWrapper handles all the complex logic of resizing, including:
 * - Mouse event handling for resize operations
 * - Width constraints enforcement
 * - Width persistence with localStorage
 * - Container-based ratio calculations for precise control
 * - Responsive behavior based on container size changes
 * - Smooth initialization to prevent visual jumps
 *
 * @param props - Component props (containerRef is required)
 * @returns A resizable container with the specified behavior and constraints
 */
export const ResizableWrapper = ({
    children,
    className,
    minWidth = DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST,
    maxRatio = DEFAULT_MAX_RATIO_OF_MAILBOX_LIST_AREA,
    resizeHandlePosition = ResizeHandlePosition.RIGHT,
    onWidthChange,
    resizeHandleRef,
    persistKey,
    defaultRatio = DEFAULT_RATIO_OF_MAILBOX_LIST,
    resizingDisabled = false,
    containerRef,
    onResizingChange,
}: ResizableWrapperProps) => {
    const resizableWrapperRef = useRef<HTMLDivElement>(null);
    const innerContentRef = useRef<HTMLDivElement>(null);

    const internalResizeHandleRef = useRef<HTMLButtonElement>(null);
    const finalResizeHandleRef = resizeHandleRef || internalResizeHandleRef;

    const position = resizeHandlePosition;

    const {
        width,
        isResizing,
        enableResize,
        resetWidth: handleResetWidth,
        scrollBarWidth,
    } = useResizableUtils({
        resizableWrapperRef,
        innerContentRef,
        minWidth,
        maxRatio,
        position,
        persistKey,
        defaultRatio,
        containerRef,
    });

    const resetWidth = () => {
        handleResetWidth();
        onWidthChange?.(width);
    };

    useEffect(() => {
        onWidthChange?.(width);
    }, [width]);

    useEffect(() => {
        onResizingChange?.(isResizing);
    }, [isResizing]);

    if (resizingDisabled) {
        return children;
    }

    return (
        <div
            ref={resizableWrapperRef}
            className={clsx(
                'resizable-wrapper flex flex-column overflow-hidden relative',
                isResizing ? 'user-select-none' : '',
                className
            )}
            style={{
                width: `${width}px`,
            }}
            data-testid="resizable-wrapper"
        >
            <div ref={innerContentRef} className="w-full h-full flex-1 overflow-hidden">
                {children}
            </div>
            <ResizeHandle
                resizeAreaRef={finalResizeHandleRef}
                enableResize={enableResize}
                resetWidth={resetWidth}
                scrollBarWidth={scrollBarWidth}
                position={position}
            />
        </div>
    );
};

export default ResizableWrapper;
