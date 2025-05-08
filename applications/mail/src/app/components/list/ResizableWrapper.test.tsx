import { fireEvent, render, screen } from '@testing-library/react';

import { ResizableWrapper } from './ResizableWrapper';
import { ResizeHandlePosition } from './ResizeHandle';

jest.mock('../../hooks/useResizableUtils', () => ({
    ...jest.requireActual('../../hooks/useResizableUtils'),
    useResizableUtils: jest.fn(() => ({
        width: 400,
        isResizing: false,
        enableResize: jest.fn(),
        resetWidth: jest.fn(),
        scrollBarWidth: 10,
    })),
}));

describe('ResizableWrapper', () => {
    const TestComponent = () => <div data-testid="test-content">Test Content</div>;

    beforeEach(() => {
        jest.clearAllMocks();

        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
            },
            writable: true,
        });

        Element.prototype.getBoundingClientRect = jest.fn(() => ({
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
        render(
            <ResizableWrapper>
                <TestComponent />
            </ResizableWrapper>
        );

        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.getByTestId('resizable-wrapper')).toBeInTheDocument();
    });

    it('bypasses resizable behavior when resizingDisabled is true', () => {
        render(
            <ResizableWrapper resizingDisabled>
                <TestComponent />
            </ResizableWrapper>
        );

        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.queryByTestId('resizable-wrapper')).not.toBeInTheDocument();
    });

    it('applies correct className and style to wrapper', () => {
        const { useResizableUtils } = require('../../hooks/useResizableUtils');
        useResizableUtils.mockReturnValue({
            width: 500,
            isResizing: true,
            enableResize: jest.fn(),
            resetWidth: jest.fn(),
            scrollBarWidth: 10,
        });

        render(
            <ResizableWrapper className="custom-class">
                <TestComponent />
            </ResizableWrapper>
        );

        const wrapper = screen.getByTestId('resizable-wrapper');
        expect(wrapper).toHaveClass('custom-class');
        expect(wrapper).toHaveClass('user-select-none');
        expect(wrapper.style.width).toBe('500px');
    });

    it('renders resize handle with correct position (right by default)', () => {
        render(
            <ResizableWrapper>
                <TestComponent />
            </ResizableWrapper>
        );

        const handle = screen.getByRole('button', { name: /resize panel/i });
        expect(handle).toHaveAttribute('data-position', 'right');
    });

    it('renders resize handle with left position when specified', () => {
        render(
            <ResizableWrapper resizeHandlePosition={ResizeHandlePosition.LEFT}>
                <TestComponent />
            </ResizableWrapper>
        );

        const handle = screen.getByRole('button', { name: /resize panel/i });
        expect(handle).toHaveAttribute('data-position', 'left');
    });

    it('calls enableResize when resize handle is clicked', () => {
        const mockEnableResize = jest.fn();
        const { useResizableUtils } = require('../../hooks/useResizableUtils');
        useResizableUtils.mockReturnValue({
            width: 400,
            isResizing: false,
            enableResize: mockEnableResize,
            resetWidth: jest.fn(),
            scrollBarWidth: 10,
        });

        render(
            <ResizableWrapper>
                <TestComponent />
            </ResizableWrapper>
        );

        const handle = screen.getByRole('button', { name: /resize panel/i });
        fireEvent.mouseDown(handle);

        expect(mockEnableResize).toHaveBeenCalled();
    });

    it('calls resetWidth when resize handle is double-clicked', () => {
        const mockResetWidth = jest.fn();
        const { useResizableUtils } = require('../../hooks/useResizableUtils');
        useResizableUtils.mockReturnValue({
            width: 400,
            isResizing: false,
            enableResize: jest.fn(),
            resetWidth: mockResetWidth,
            scrollBarWidth: 10,
        });

        render(
            <ResizableWrapper defaultRatio={0.4}>
                <TestComponent />
            </ResizableWrapper>
        );

        const handle = screen.getByRole('button', { name: /resize panel/i });
        fireEvent.doubleClick(handle);

        expect(mockResetWidth).toHaveBeenCalled();
    });

    it('calls onWidthChange when width changes', () => {
        const mockOnWidthChange = jest.fn();

        const { rerender } = render(
            <ResizableWrapper onWidthChange={mockOnWidthChange}>
                <TestComponent />
            </ResizableWrapper>
        );

        expect(mockOnWidthChange).toHaveBeenCalledWith(400);

        const { useResizableUtils } = require('../../hooks/useResizableUtils');
        useResizableUtils.mockReturnValue({
            width: 500,
            isResizing: false,
            enableResize: jest.fn(),
            resetWidth: jest.fn(),
            scrollBarWidth: 10,
        });

        rerender(
            <ResizableWrapper onWidthChange={mockOnWidthChange}>
                <TestComponent />
            </ResizableWrapper>
        );

        expect(mockOnWidthChange).toHaveBeenCalledWith(500);
    });

    it('integrates with useResizable hook with correct parameters', () => {
        const { useResizableUtils } = require('../../hooks/useResizableUtils');

        render(
            <ResizableWrapper
                minWidth={300}
                maxRatio={0.5}
                persistKey="testKey"
                drawerKey="testDrawerKey"
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
                drawerKey: 'testDrawerKey',
                defaultRatio: 0.45,
            })
        );
    });
});
