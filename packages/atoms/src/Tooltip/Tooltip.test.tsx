import { createRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
    let timerUserEvent: UserEvent;

    beforeEach(() => {
        vi.useFakeTimers();
        // @testing-library/dom detects fake timers through the `jest` global to flush its async wrapper
        vi.stubGlobal('jest', { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) });
        timerUserEvent = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('should show tooltip immediately when externally opened', () => {
        render(
            <Tooltip title={<span data-testid="tooltip">World</span>} isOpen>
                <span data-testid="span">Hello</span>
            </Tooltip>
        );
        expect(screen.getByTestId('span')).toHaveTextContent('Hello');
        expect(screen.getByTestId('tooltip')).toHaveTextContent('World');
    });

    it('should not show tooltip when not open', () => {
        render(
            <Tooltip title={<span data-testid="tooltip">World</span>} isOpen={false}>
                <span data-testid="span">Hello</span>
            </Tooltip>
        );
        expect(screen.getByTestId('span')).toHaveTextContent('Hello');
        expect(screen.queryByTestId('tooltip')).toBeNull();
    });

    it('should not close tooltip when externally opened', async () => {
        render(
            <>
                <Tooltip title={<span data-testid="tooltip">World</span>} isOpen>
                    <span data-testid="span">Hello</span>
                </Tooltip>
                <div data-testid="outside">hello</div>
            </>
        );
        expect(screen.getByTestId('span')).toHaveTextContent('Hello');
        expect(screen.getByTestId('tooltip')).toHaveTextContent('World');

        await timerUserEvent.unhover(screen.getByTestId('span'));
        await timerUserEvent.click(screen.getByTestId('outside'));

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-out-last' });

        expect(screen.getByTestId('span')).toHaveTextContent('Hello');
        expect(screen.getByTestId('tooltip')).toHaveTextContent('World');
    });

    it('should show and hide tooltip with a delay', async () => {
        render(
            <Tooltip title={<span data-testid="tooltip">World</span>}>
                <span data-testid="span">Hello</span>
            </Tooltip>
        );
        expect(screen.getByTestId('span')).toHaveTextContent('Hello');
        expect(screen.queryByTestId('tooltip')).toBeNull();

        await timerUserEvent.hover(screen.getByTestId('span'));

        expect(screen.queryByTestId('tooltip')).toBeNull();
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-in-first' });
        expect(screen.getByTestId('tooltip')).toHaveTextContent('World');
        await timerUserEvent.unhover(screen.getByTestId('span'));
        expect(screen.getByTestId('tooltip')).toHaveTextContent('World');

        act(() => {
            vi.advanceTimersByTime(500);
        });
        fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-out-last' });
        expect(screen.queryByTestId('tooltip')).toBeNull();
    });

    it('should show second tooltip instantly and hide tooltip with a delay', async () => {
        render(
            <>
                <Tooltip title={<span data-testid="tooltip-1">World</span>}>
                    <span data-testid="span-1">Hello</span>
                </Tooltip>
                <Tooltip title={<span data-testid="tooltip-2">Bar</span>}>
                    <span data-testid="span-2">Foo</span>
                </Tooltip>
            </>
        );
        expect(screen.queryByTestId('tooltip-1')).toBeNull();
        expect(screen.queryByTestId('tooltip-2')).toBeNull();

        await timerUserEvent.hover(screen.getByTestId('span-1'));

        expect(screen.queryByTestId('tooltip-1')).toBeNull();
        expect(screen.queryByTestId('tooltip-2')).toBeNull();
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        fireEvent.animationEnd(screen.getByTestId('tooltip-1'), { animationName: 'anime-tooltip-in-first' });
        expect(screen.getByTestId('tooltip-1')).toHaveTextContent('World');
        expect(screen.queryByTestId('tooltip-2')).toBeNull();

        await timerUserEvent.unhover(screen.getByTestId('span-1'));
        expect(screen.getByTestId('tooltip-1')).toHaveTextContent('World');
        expect(screen.queryByTestId('tooltip-2')).toBeNull();

        await timerUserEvent.hover(screen.getByTestId('span-2'));
        fireEvent.animationEnd(screen.getByTestId('tooltip-1'), { animationName: 'anime-tooltip-out' });
        expect(screen.queryByTestId('tooltip-1')).toBeNull();
        fireEvent.animationEnd(screen.getByTestId('tooltip-2'), { animationName: 'anime-tooltip-in' });
        expect(screen.getByTestId('tooltip-2')).toHaveTextContent('Bar');

        await timerUserEvent.unhover(screen.getByTestId('span-2'));
        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(screen.queryByTestId('tooltip-1')).toBeNull();
        fireEvent.animationEnd(screen.getByTestId('tooltip-2'), { animationName: 'anime-tooltip-out-last' });
        expect(screen.queryByTestId('tooltip-2')).toBeNull();
    });

    it('should anchor on a generated icon child', () => {
        const ref = createRef<HTMLElement>();
        render(
            <Tooltip ref={ref} title="World">
                <IcInfoCircle data-testid="icon" />
            </Tooltip>
        );
        expect(ref.current).toBe(screen.getByTestId('icon'));
    });

    it('should keep the open delay after a tooltip unmounts while its open delay is pending', async () => {
        const Tooltips = ({ showFirst }: { showFirst: boolean }) => (
            <>
                {showFirst && (
                    <Tooltip title={<span data-testid="tooltip-1">World</span>}>
                        <span data-testid="span-1">Hello</span>
                    </Tooltip>
                )}
                <Tooltip title={<span data-testid="tooltip-2">Bar</span>}>
                    <span data-testid="span-2">Foo</span>
                </Tooltip>
            </>
        );
        const { rerender } = render(<Tooltips showFirst />);

        await timerUserEvent.hover(screen.getByTestId('span-1'));
        rerender(<Tooltips showFirst={false} />);
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        await timerUserEvent.hover(screen.getByTestId('span-2'));
        expect(screen.queryByTestId('tooltip-2')).toBeNull();

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getByTestId('tooltip-2')).toHaveTextContent('Bar');
    });

    describe('focusVisibleOnly', () => {
        beforeEach(() => {
            render(
                <Tooltip title={<span data-testid="tooltip">World</span>} focusVisibleOnly>
                    <button type="button">Hello</button>
                </Tooltip>
            );
        });

        it('should not show tooltip on programmatic focus', () => {
            const button = screen.getByRole('button', { name: 'Hello' });
            vi.spyOn(button, 'matches').mockImplementation((selector) => selector !== ':focus-visible');

            act(() => button.focus());

            expect(screen.queryByTestId('tooltip')).toBeNull();
        });

        it('should not show tooltip when the window regains focus', async () => {
            const button = screen.getByRole('button', { name: 'Hello' });
            await timerUserEvent.tab();

            // Window blur
            fireEvent.blur(button);
            act(() => {
                vi.advanceTimersByTime(500);
            });
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-out-last' });
            fireEvent.focus(button);

            expect(screen.queryByTestId('tooltip')).toBeNull();
        });
    });
});
