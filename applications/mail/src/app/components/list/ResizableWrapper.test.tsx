import { fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useResizableUtils } from '../../hooks/useResizableUtils';
import { ResizableWrapper } from './ResizableWrapper';
import { ResizeHandlePosition } from './ResizeHandle';

vi.mock('../../hooks/useResizableUtils', async () => ({
    ...(await vi.importActual('../../hooks/useResizableUtils')),
    useResizableUtils: vi.fn(() => ({
        width: 400,
        isResizing: false,
        enableResize: vi.fn(),
        resetWidth: vi.fn(),
        scrollBarWidth: 10,
    })),
}));

describe('ResizableWrapper', () => {
    const TestComponent = () => <div data-testid="test-content">Test Content</div>;

    const createMockContainerRef = () => {
        const mockElement = {
            getBoundingClientRect: vi.fn().mockReturnValue({ width: 1000 }),
        };
        return { current: mockElement as unknown as HTMLElement };
    };

    beforeEach(() => {
        vi.clearAllMocks();

        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
            },
            writable: true,
        });

        Element.prototype.getBoundingClientRect = vi.fn(() => ({
            width: 400,
            height: 400,
            top: 0,
            left: 0,
            bottom: 400,
            right: 400,
            x: 0,
            y: 0,
            toJSON: () => {},
        }));
    });

    it('renders children correctly', () => {
        const containerRef = createMockContainerRef();

        render(
            <ResizableWrapper containerRef={containerRef}>
                <TestComponent />
            </ResizableWrapper>
        );

        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.getByTestId('resizable-wrapper')).toBeInTheDocument();
    });

    it('bypasses resizable behavior when resizingDisabled is true', () => {
        const containerRef = createMockContainerRef();

        render(
            <ResizableWrapper containerRef={containerRef} resizingDisabled>
                <TestComponent />
            </ResizableWrapper>
        );

        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.queryByTestId('resizable-wrapper')).not.toBeInTheDocument();
    });

    it('applies correct className and style to wrapper', () => {
        const containerRef = createMockContainerRef();
        (useResizableUtils as Mock).mockReturnValue({
            width: 500,
            isResizing: true,
            enableResize: vi.fn(),
            resetWidth: vi.fn(),
            scrollBarWidth: 10,
        });

        render(
            <ResizableWrapper containerRef={containerRef} className="custom-class">
                <TestComponent />
            </ResizableWrapper>
        );

        const wrapper = screen.getByTestId('resizable-wrapper');
        expect(wrapper).toHaveClass('custom-class');
        expect(wrapper).toHaveClass('user-select-none');
        expect(wrapper.style.width).toBe('500px');
    });

    it('renders resize handle with correct position (right by default)', () => {
        const containerRef = createMockContainerRef();

        render(
            <ResizableWrapper containerRef={containerRef}>
                <TestComponent />
            </ResizableWrapper>
        );

        const handle = screen.getByRole('button', { name: /resize panel/i });
        expect(handle).toHaveAttribute('data-position', 'right');
    });

    it('renders resize handle with left position when specified', () => {
        const containerRef = createMockContainerRef();

        render(
            <ResizableWrapper containerRef={containerRef} resizeHandlePosition={ResizeHandlePosition.LEFT}>
                <TestComponent />
            </ResizableWrapper>
        );

        const handle = screen.getByRole('button', { name: /resize panel/i });
        expect(handle).toHaveAttribute('data-position', 'left');
    });

    it('calls enableResize when resize handle is clicked', () => {
        const containerRef = createMockContainerRef();
        const mockEnableResize = vi.fn();
        (useResizableUtils as Mock).mockReturnValue({
            width: 400,
            isResizing: false,
            enableResize: mockEnableResize,
            resetWidth: vi.fn(),
            scrollBarWidth: 10,
        });

        render(
            <ResizableWrapper containerRef={containerRef}>
                <TestComponent />
            </ResizableWrapper>
        );

        const handle = screen.getByRole('button', { name: /resize panel/i });
        fireEvent.mouseDown(handle);

        expect(mockEnableResize).toHaveBeenCalled();
    });

    it('calls resetWidth when resize handle is double-clicked', () => {
        const containerRef = createMockContainerRef();
        const mockResetWidth = vi.fn();
        (useResizableUtils as Mock).mockReturnValue({
            width: 400,
            isResizing: false,
            enableResize: vi.fn(),
            resetWidth: mockResetWidth,
            scrollBarWidth: 10,
        });

        render(
            <ResizableWrapper containerRef={containerRef} defaultRatio={0.4}>
                <TestComponent />
            </ResizableWrapper>
        );

        const handle = screen.getByRole('button', { name: /resize panel/i });
        fireEvent.doubleClick(handle);

        expect(mockResetWidth).toHaveBeenCalled();
    });

    it('calls onWidthChange when width changes', () => {
        const containerRef = createMockContainerRef();
        const mockOnWidthChange = vi.fn();

        const { rerender } = render(
            <ResizableWrapper containerRef={containerRef} onWidthChange={mockOnWidthChange}>
                <TestComponent />
            </ResizableWrapper>
        );

        expect(mockOnWidthChange).toHaveBeenCalledWith(400);

        (useResizableUtils as Mock).mockReturnValue({
            width: 500,
            isResizing: false,
            enableResize: vi.fn(),
            resetWidth: vi.fn(),
            scrollBarWidth: 10,
        });

        rerender(
            <ResizableWrapper containerRef={containerRef} onWidthChange={mockOnWidthChange}>
                <TestComponent />
            </ResizableWrapper>
        );

        expect(mockOnWidthChange).toHaveBeenCalledWith(500);
    });

    it('integrates with useResizable hook with correct parameters', () => {
        const containerRef = createMockContainerRef();

        render(
            <ResizableWrapper
                containerRef={containerRef}
                minWidth={300}
                maxRatio={0.5}
                persistKey="testKey"
                defaultRatio={0.45}
                resizeHandlePosition={ResizeHandlePosition.LEFT}
            >
                <TestComponent />
            </ResizableWrapper>
        );

        expect(useResizableUtils).toHaveBeenCalledWith(
            expect.objectContaining({
                minWidth: 300,
                maxRatio: 0.5,
                persistKey: 'testKey',
                defaultRatio: 0.45,
                containerRef,
            })
        );
    });
});
