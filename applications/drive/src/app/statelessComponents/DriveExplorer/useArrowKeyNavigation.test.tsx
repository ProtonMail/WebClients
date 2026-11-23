import { useRef } from 'react';

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type ScrollToRowAlign, useArrowKeyNavigation } from './useArrowKeyNavigation';

// Mirrors the markup of the list and grid: one activator per item, inside its item container
const Items = ({
    itemIds,
    renderedIds = itemIds,
    itemsPerRow,
    scrollToRow,
}: {
    itemIds: string[];
    // The items the virtualizer currently renders
    renderedIds?: string[];
    itemsPerRow: number;
    scrollToRow: (rowIndex: number, align: ScrollToRowAlign) => void;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useArrowKeyNavigation({ containerRef, itemIds, itemsPerRow, scrollToRow });

    return (
        <div ref={containerRef}>
            {renderedIds.map((uid) => (
                <div key={uid} data-drive-explorer-item-uid={uid}>
                    <button type="button" data-item-activator="" aria-label={uid} />
                </div>
            ))}
        </div>
    );
};

// Runs animation frames only when the test asks, so a virtualizer render can happen between two frames
const controlAnimationFrames = () => {
    let callbacks = new Map<number, FrameRequestCallback>();
    let nextId = 1;
    const cancelAnimationFrame = vi.fn((id: number) => callbacks.delete(id));
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callbacks.set(nextId, callback);
        return nextId++;
    });
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

    const runFrame = () => {
        const pending = callbacks;
        callbacks = new Map();
        act(() => pending.forEach((callback) => callback(performance.now())));
    };
    return { runFrame, cancelAnimationFrame };
};

const renderItems = (itemIds: string[], itemsPerRow = 1) => {
    const scrollToRow = vi.fn();
    render(<Items itemIds={itemIds} itemsPerRow={itemsPerRow} scrollToRow={scrollToRow} />);
    return { scrollToRow, user: userEvent.setup() };
};

describe('useArrowKeyNavigation', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('scrolls the virtualizer to the last row and focuses it on End', async () => {
        const { scrollToRow, user } = renderItems(['a', 'b', 'c', 'd', 'e']);

        screen.getByLabelText('a').focus();
        await user.keyboard('{End}');

        expect(scrollToRow).toHaveBeenCalledWith(4, 'center');
        expect(screen.getByLabelText('e')).toHaveFocus();
    });

    it('scrolls the virtualizer to the first row and focuses it on Home', async () => {
        const { scrollToRow, user } = renderItems(['a', 'b', 'c', 'd', 'e']);

        screen.getByLabelText('d').focus();
        await user.keyboard('{Home}');

        expect(scrollToRow).toHaveBeenCalledWith(0, 'center');
        expect(screen.getByLabelText('a')).toHaveFocus();
    });

    it('scrolls only as needed when moving to the next row', async () => {
        const { scrollToRow, user } = renderItems(['a', 'b', 'c']);

        screen.getByLabelText('a').focus();
        await user.keyboard('{ArrowDown}');

        expect(scrollToRow).toHaveBeenCalledWith(1, 'auto');
        expect(screen.getByLabelText('b')).toHaveFocus();
    });

    it('scrolls to the row of the item in a grid', async () => {
        const { scrollToRow, user } = renderItems(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 3);

        screen.getByLabelText('a').focus();
        await user.keyboard('{End}');

        expect(scrollToRow).toHaveBeenCalledWith(2, 'center');
        expect(screen.getByLabelText('g')).toHaveFocus();
    });

    it('does not let focus scroll the list on its own', async () => {
        const { user } = renderItems(['a', 'b']);
        const focus = vi.spyOn(screen.getByLabelText('b'), 'focus');

        screen.getByLabelText('a').focus();
        await user.keyboard('{ArrowDown}');

        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('focuses the target once the virtualizer renders it, a few frames after scrolling', async () => {
        const { runFrame } = controlAnimationFrames();
        const itemIds = ['a', 'b', 'c', 'd', 'e'];
        const scrollToRow = vi.fn();
        const { rerender } = render(
            <Items itemIds={itemIds} renderedIds={['a', 'b']} itemsPerRow={1} scrollToRow={scrollToRow} />
        );
        const user = userEvent.setup();

        screen.getByLabelText('a').focus();
        await user.keyboard('{End}');
        expect(scrollToRow).toHaveBeenCalledWith(4, 'center');
        runFrame();
        expect(screen.getByLabelText('a')).toHaveFocus();

        // The virtualizer renders the end of the list after scrolling
        rerender(<Items itemIds={itemIds} renderedIds={['d', 'e']} itemsPerRow={1} scrollToRow={scrollToRow} />);
        runFrame();

        expect(screen.getByLabelText('e')).toHaveFocus();
    });

    it('stops waiting for the target after a few frames', async () => {
        const { runFrame } = controlAnimationFrames();
        const itemIds = ['a', 'b', 'c', 'd', 'e'];
        const { rerender } = render(
            <Items itemIds={itemIds} renderedIds={['a', 'b']} itemsPerRow={1} scrollToRow={vi.fn()} />
        );
        const user = userEvent.setup();

        screen.getByLabelText('a').focus();
        await user.keyboard('{End}');
        for (let frame = 0; frame < 20; frame++) {
            runFrame();
        }
        rerender(<Items itemIds={itemIds} renderedIds={['d', 'e']} itemsPerRow={1} scrollToRow={vi.fn()} />);
        runFrame();

        expect(screen.getByLabelText('e')).not.toHaveFocus();
    });

    // Callers like Trash and SharedByMe pass a new itemIds array on every render
    it('keeps waiting for the target when the parent re-renders with a new itemIds array', async () => {
        const { runFrame } = controlAnimationFrames();
        const itemIds = ['a', 'b', 'c', 'd', 'e'];
        const scrollToRow = vi.fn();
        const { rerender } = render(
            <Items itemIds={itemIds} renderedIds={['a', 'b']} itemsPerRow={1} scrollToRow={scrollToRow} />
        );
        const user = userEvent.setup();

        screen.getByLabelText('a').focus();
        await user.keyboard('{End}');

        rerender(<Items itemIds={[...itemIds]} renderedIds={['a', 'b']} itemsPerRow={1} scrollToRow={scrollToRow} />);
        runFrame();
        rerender(<Items itemIds={[...itemIds]} renderedIds={['d', 'e']} itemsPerRow={1} scrollToRow={scrollToRow} />);
        runFrame();

        expect(screen.getByLabelText('e')).toHaveFocus();
    });

    it('stops waiting for the target to render when unmounted', async () => {
        const { cancelAnimationFrame } = controlAnimationFrames();
        const itemIds = ['a', 'b', 'c'];
        const { unmount } = render(
            <Items itemIds={itemIds} renderedIds={['a']} itemsPerRow={1} scrollToRow={vi.fn()} />
        );
        const user = userEvent.setup();

        screen.getByLabelText('a').focus();
        await user.keyboard('{End}');
        unmount();

        expect(cancelAnimationFrame).toHaveBeenCalled();
    });
});
