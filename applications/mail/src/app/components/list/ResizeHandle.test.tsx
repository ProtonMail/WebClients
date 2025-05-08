import { fireEvent, render, screen } from '@testing-library/react';

import { ResizeHandle, ResizeHandlePosition } from './ResizeHandle';

describe('ResizeHandle', () => {
    const mockEnableResize = jest.fn();
    const mockResetWidth = jest.fn();
    const mockResizeAreaRef = { current: null };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with default right position', () => {
        render(
            <ResizeHandle
                resizeAreaRef={mockResizeAreaRef}
                enableResize={mockEnableResize}
                resetWidth={mockResetWidth}
                scrollBarWidth={10}
            />
        );

        const resizeHandle = screen.getByRole('button', { name: /resize panel/i });
        expect(resizeHandle).toBeInTheDocument();
        expect(resizeHandle).toHaveAttribute('data-position', 'right');
    });

    it('renders with left position when specified', () => {
        render(
            <ResizeHandle
                resizeAreaRef={mockResizeAreaRef}
                enableResize={mockEnableResize}
                resetWidth={mockResetWidth}
                scrollBarWidth={10}
                position={ResizeHandlePosition.LEFT}
            />
        );

        const resizeHandle = screen.getByRole('button', { name: /resize panel/i });
        expect(resizeHandle).toBeInTheDocument();
        expect(resizeHandle).toHaveAttribute('data-position', 'left');
    });

    it('calls enableResize on mousedown', () => {
        render(
            <ResizeHandle
                resizeAreaRef={mockResizeAreaRef}
                enableResize={mockEnableResize}
                resetWidth={mockResetWidth}
                scrollBarWidth={10}
            />
        );

        const resizeHandle = screen.getByRole('button', { name: /resize panel/i });
        fireEvent.mouseDown(resizeHandle);

        expect(mockEnableResize).toHaveBeenCalled();
    });

    it('calls resetWidth on double click', () => {
        render(
            <ResizeHandle
                resizeAreaRef={mockResizeAreaRef}
                enableResize={mockEnableResize}
                resetWidth={mockResetWidth}
                scrollBarWidth={10}
            />
        );

        const resizeHandle = screen.getByRole('button', { name: /resize panel/i });
        fireEvent.doubleClick(resizeHandle);

        expect(mockResetWidth).toHaveBeenCalled();
    });

    it('has correct accessibility attributes', () => {
        render(
            <ResizeHandle
                resizeAreaRef={mockResizeAreaRef}
                enableResize={mockEnableResize}
                resetWidth={mockResetWidth}
                scrollBarWidth={10}
            />
        );

        const resizeHandle = screen.getByRole('button', { name: /resize panel/i });

        expect(resizeHandle).toHaveAttribute('aria-label', 'Resize panel');

        expect(resizeHandle).toHaveAttribute('title', 'Drag to resize or double-click to reset');

        const srDescription = screen.getByText(
            /use your mouse to resize the view\. if you're using your keyboard, you can use left and right arrow keys to resize\./i
        );
        expect(srDescription).toHaveClass('sr-only');
    });
});
