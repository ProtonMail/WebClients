import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';

import { UploadDragDrop } from './UploadDragDrop';
import { DRAG_IDLE_TIMEOUT_MS } from './useUploadDragDropOverlay';

const filesDataTransfer = { types: ['Files'] };

// happy-dom builds its own DataTransfer from the event init, so the fake one is set on the event itself
const fireDragEvent = (type: 'dragOver' | 'drop', element: Element, dataTransfer: unknown) => {
    const event = createEvent[type](element);
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    fireEvent(element, event);
};

const renderDragDrop = (onDrop = vi.fn()) => {
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
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the overlay when files are dragged from outside the page', () => {
        const { content } = renderDragDrop();

        fireDragEvent('dragOver', content, filesDataTransfer);

        expect(isOverlayVisible()).toBe(true);
    });

    it('does not throw when dataTransfer is null', () => {
        const { content } = renderDragDrop();

        expect(() => fireDragEvent('dragOver', content, null)).not.toThrow();
        expect(isOverlayVisible()).toBe(false);
    });

    it('ignores drags that started inside the page', () => {
        const { content } = renderDragDrop();

        fireEvent.dragStart(content);
        fireDragEvent('dragOver', content, filesDataTransfer);

        expect(isOverlayVisible()).toBe(false);
    });

    it('hides the overlay when dragover events stop without a drop', () => {
        const { content } = renderDragDrop();
        fireDragEvent('dragOver', content, filesDataTransfer);

        act(() => {
            vi.advanceTimersByTime(DRAG_IDLE_TIMEOUT_MS);
        });

        expect(isOverlayVisible()).toBe(false);
    });

    it('keeps the overlay while dragover events keep coming', () => {
        const { content } = renderDragDrop();
        fireDragEvent('dragOver', content, filesDataTransfer);

        act(() => {
            vi.advanceTimersByTime(DRAG_IDLE_TIMEOUT_MS - 100);
        });
        fireDragEvent('dragOver', content, filesDataTransfer);
        act(() => {
            vi.advanceTimersByTime(DRAG_IDLE_TIMEOUT_MS - 100);
        });

        expect(isOverlayVisible()).toBe(true);
    });

    it('hides the overlay when the drop happens outside of it', () => {
        const { content } = renderDragDrop();
        fireDragEvent('dragOver', content, filesDataTransfer);

        fireEvent.drop(content);

        expect(isOverlayVisible()).toBe(false);
    });

    it('uploads the dropped files and hides the overlay', () => {
        const { content, onDrop } = renderDragDrop();
        fireDragEvent('dragOver', content, filesDataTransfer);

        fireDragEvent('drop', screen.getByText('Drop to upload'), filesDataTransfer);

        expect(onDrop).toHaveBeenCalledWith(filesDataTransfer);
        expect(isOverlayVisible()).toBe(false);
    });
});
