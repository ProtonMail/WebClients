import { act, fireEvent, render, screen } from '@testing-library/react';

import { UploadDragDrop } from './UploadDragDrop';
import { DRAG_IDLE_TIMEOUT_MS } from './useUploadDragDropOverlay';

const filesDataTransfer = { types: ['Files'] };

const renderDragDrop = (onDrop = jest.fn()) => {
    render(
        <UploadDragDrop onDrop={onDrop}>
            <div data-testid="content">content</div>
        </UploadDragDrop>
    );
    return { content: screen.getByTestId('content'), onDrop };
};

const isOverlayVisible = () => screen.queryByText('Drop to upload') !== null;

describe('UploadDragDrop', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('shows the overlay when files are dragged from outside the page', () => {
        const { content } = renderDragDrop();

        fireEvent.dragOver(content, { dataTransfer: filesDataTransfer });

        expect(isOverlayVisible()).toBe(true);
    });

    it('does not throw when dataTransfer is null', () => {
        const { content } = renderDragDrop();

        expect(() => fireEvent.dragOver(content, { dataTransfer: null })).not.toThrow();
        expect(isOverlayVisible()).toBe(false);
    });

    it('ignores drags that started inside the page', () => {
        const { content } = renderDragDrop();

        fireEvent.dragStart(content);
        fireEvent.dragOver(content, { dataTransfer: filesDataTransfer });

        expect(isOverlayVisible()).toBe(false);
    });

    it('hides the overlay when dragover events stop without a drop', () => {
        const { content } = renderDragDrop();
        fireEvent.dragOver(content, { dataTransfer: filesDataTransfer });

        act(() => {
            jest.advanceTimersByTime(DRAG_IDLE_TIMEOUT_MS);
        });

        expect(isOverlayVisible()).toBe(false);
    });

    it('keeps the overlay while dragover events keep coming', () => {
        const { content } = renderDragDrop();
        fireEvent.dragOver(content, { dataTransfer: filesDataTransfer });

        act(() => {
            jest.advanceTimersByTime(DRAG_IDLE_TIMEOUT_MS - 100);
        });
        fireEvent.dragOver(content, { dataTransfer: filesDataTransfer });
        act(() => {
            jest.advanceTimersByTime(DRAG_IDLE_TIMEOUT_MS - 100);
        });

        expect(isOverlayVisible()).toBe(true);
    });

    it('hides the overlay when the drop happens outside of it', () => {
        const { content } = renderDragDrop();
        fireEvent.dragOver(content, { dataTransfer: filesDataTransfer });

        fireEvent.drop(content);

        expect(isOverlayVisible()).toBe(false);
    });

    it('uploads the dropped files and hides the overlay', () => {
        const { content, onDrop } = renderDragDrop();
        fireEvent.dragOver(content, { dataTransfer: filesDataTransfer });

        fireEvent.drop(screen.getByText('Drop to upload'), { dataTransfer: filesDataTransfer });

        expect(onDrop).toHaveBeenCalledWith(filesDataTransfer);
        expect(isOverlayVisible()).toBe(false);
    });
});
