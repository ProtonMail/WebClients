import { act, renderHook } from '@testing-library/react';

import { ResizeHandlePosition } from 'proton-mail/components/list/ResizeHandle';

import { resetMemoryCacheForTesting, useResizableUtils } from './useResizableUtils';

// Mock useHandler and useWindowSize implementations for easier testing
jest.mock('@proton/components', () => ({
    useHandler: jest.fn((fn) => {
        const handler = (...args: any[]) => fn(...args);
        handler.cancel = jest.fn();
        return handler;
    }),
    useWindowSize: jest.fn(() => [1000, 1000]),
}));

const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

beforeAll(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });

    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
});

// Reset before each test
beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    resetMemoryCacheForTesting();
});

describe('useResizable', () => {
    const createMockContainerRef = () => {
        const mockElement = {
            getBoundingClientRect: jest.fn().mockReturnValue({ width: 1000 }),
        };
        return { current: mockElement as unknown as HTMLElement };
    };

    it('should initialize with default values', () => {
        const containerRef = { current: document.createElement('div') };
        const contentRef = { current: document.createElement('div') };
        const containerRef2 = createMockContainerRef();

        const { result } = renderHook(() =>
            useResizableUtils({
                resizableWrapperRef: containerRef as React.RefObject<HTMLDivElement>,
                innerContentRef: contentRef as React.RefObject<HTMLDivElement>,
                minWidth: 280,
                maxRatio: 0.6,
                position: ResizeHandlePosition.RIGHT,
                containerRef: containerRef2,
            })
        );

        expect(result.current.width).toBe(350); // Default is defaultRatio (0.35) * containerWidth (1000)
        expect(result.current.isResizing).toBe(false);
        expect(typeof result.current.enableResize).toBe('function');
        expect(typeof result.current.resetWidth).toBe('function');
        expect(result.current.scrollBarWidth).toBe(0);
    });

    it('should load saved width from localStorage if persistKey is provided', () => {
        const containerRef = { current: document.createElement('div') };
        const contentRef = { current: document.createElement('div') };
        const containerRef2 = createMockContainerRef();

        // Setup mock implementation for this test
        window.localStorage.getItem = jest.fn().mockReturnValue('0.4'); // Testing with ratio

        const { result } = renderHook(() =>
            useResizableUtils({
                resizableWrapperRef: containerRef as React.RefObject<HTMLDivElement>,
                innerContentRef: contentRef as React.RefObject<HTMLDivElement>,
                minWidth: 280,
                maxRatio: 0.6,
                position: ResizeHandlePosition.RIGHT,
                persistKey: 'testKey',
                containerRef: containerRef2,
            })
        );

        expect(window.localStorage.getItem).toHaveBeenCalledWith('testKey');
        expect(result.current.width).toBe(400); // 0.4 * 1000
    });

    it('should apply default ratio if no saved width and defaultRatio is provided', () => {
        const containerRef = { current: document.createElement('div') };
        const contentRef = { current: document.createElement('div') };
        const containerRef2 = createMockContainerRef();

        // Return null for localStorage.getItem
        window.localStorage.getItem = jest.fn().mockReturnValue(null);

        const { result } = renderHook(() =>
            useResizableUtils({
                resizableWrapperRef: containerRef as React.RefObject<HTMLDivElement>,
                innerContentRef: contentRef as React.RefObject<HTMLDivElement>,
                minWidth: 280,
                maxRatio: 0.6,
                position: ResizeHandlePosition.RIGHT,
                persistKey: 'testKey',
                defaultRatio: 0.4,
                containerRef: containerRef2,
            })
        );

        expect(result.current.width).toBe(400); // 0.4 * containerWidth (1000)
    });

    it('should cap width at maxRatio * containerWidth', () => {
        const containerRef = { current: document.createElement('div') };
        const contentRef = { current: document.createElement('div') };
        const containerRef2 = createMockContainerRef();

        // Mock localStorage to return a large value
        window.localStorage.getItem = jest.fn().mockReturnValue('0.7');

        const { result } = renderHook(() =>
            useResizableUtils({
                resizableWrapperRef: containerRef as React.RefObject<HTMLDivElement>,
                innerContentRef: contentRef as React.RefObject<HTMLDivElement>,
                minWidth: 280,
                maxRatio: 0.6, // Max allowed width is 600px (0.6 * 1000)
                position: ResizeHandlePosition.RIGHT,
                persistKey: 'testKey',
                containerRef: containerRef2,
            })
        );

        expect(result.current.width).toBe(600); // Should max out at maxRatio (0.6) * containerWidth (1000)
    });

    it('should ensure width is not less than minWidth', () => {
        const containerRef = { current: document.createElement('div') };
        const contentRef = { current: document.createElement('div') };
        const containerRef2 = createMockContainerRef();

        window.localStorage.getItem = jest.fn().mockReturnValue('0.1'); // 0.1 * 1000 = 100 < minWidth

        const { result } = renderHook(() =>
            useResizableUtils({
                resizableWrapperRef: containerRef as React.RefObject<HTMLDivElement>,
                innerContentRef: contentRef as React.RefObject<HTMLDivElement>,
                minWidth: 280,
                maxRatio: 0.6,
                position: ResizeHandlePosition.RIGHT,
                persistKey: 'testKey',
                containerRef: containerRef2,
            })
        );

        // Even though the saved value is too small, it should use the minWidth
        expect(result.current.width).toBeGreaterThanOrEqual(280);
    });

    it('should enable resizing when enableResize is called', () => {
        // Create a properly mocked div with classList
        const mockDiv = {
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn(),
            },
            getBoundingClientRect: jest.fn().mockReturnValue({ width: 100 }),
        };
        const containerRef = { current: mockDiv as unknown as HTMLDivElement };
        const contentRef = { current: mockDiv as unknown as HTMLDivElement };
        const containerRef2 = createMockContainerRef();

        const mockEvent = {
            preventDefault: jest.fn(),
            clientX: 500,
        } as unknown as React.MouseEvent;

        const { result } = renderHook(() =>
            useResizableUtils({
                resizableWrapperRef: containerRef as React.RefObject<HTMLDivElement>,
                innerContentRef: contentRef as React.RefObject<HTMLDivElement>,
                minWidth: 280,
                maxRatio: 0.6,
                position: ResizeHandlePosition.RIGHT,
                containerRef: containerRef2,
            })
        );

        expect(result.current.isResizing).toBe(false);

        // Trigger a resize event
        act(() => {
            result.current.enableResize(mockEvent);
        });

        expect(result.current.isResizing).toBe(true);
    });

    it('should handle resize correctly with LEFT direction', () => {
        const mockDiv = {
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn(),
            },
            getBoundingClientRect: jest.fn().mockReturnValue({ width: 100 }),
        };
        const containerRef = { current: mockDiv as unknown as HTMLDivElement };
        const contentRef = { current: mockDiv as unknown as HTMLDivElement };
        const containerRef2 = createMockContainerRef();

        const { result } = renderHook(() =>
            useResizableUtils({
                resizableWrapperRef: containerRef as React.RefObject<HTMLDivElement>,
                innerContentRef: contentRef as React.RefObject<HTMLDivElement>,
                minWidth: 280,
                maxRatio: 0.6,
                position: ResizeHandlePosition.LEFT,
                containerRef: containerRef2,
            })
        );

        // Starting width is defaultRatio * containerWidth
        expect(result.current.width).toBe(350);

        const mockEvent = {
            clientX: 300,
        } as unknown as React.MouseEvent;

        // Start resize
        act(() => {
            result.current.enableResize(mockEvent);
        });

        expect(result.current.isResizing).toBe(true);
    });

    it('should reset width to defaultRatio * containerWidth when resetWidth is called', () => {
        const containerRef = { current: document.createElement('div') };
        const contentRef = { current: document.createElement('div') };
        const containerRef2 = createMockContainerRef();

        // Start with a 0.6 ratio
        window.localStorage.getItem = jest.fn().mockReturnValue('0.6');

        const { result, rerender } = renderHook(() =>
            useResizableUtils({
                resizableWrapperRef: containerRef as React.RefObject<HTMLDivElement>,
                innerContentRef: contentRef as React.RefObject<HTMLDivElement>,
                minWidth: 280,
                maxRatio: 0.6,
                position: ResizeHandlePosition.RIGHT,
                persistKey: 'testKey',
                containerRef: containerRef2,
                defaultRatio: 0.35,
            })
        );

        // Initial width should be from localStorage (0.6 ratio)
        expect(result.current.width).toBe(600);

        // Mock the localStorage for after reset
        window.localStorage.getItem = jest.fn().mockReturnValue('0.35');

        act(() => {
            result.current.resetWidth();
        });

        // Force a rerender to pick up the new localStorage value
        rerender();

        // Now expect the width to be updated with the new value from localStorage
        expect(result.current.width).toBe(350); // 0.35 * 1000

        // Should save to localStorage if persistKey is provided
        expect(window.localStorage.setItem).toHaveBeenCalledWith(expect.any(String), expect.any(String));
    });
});
