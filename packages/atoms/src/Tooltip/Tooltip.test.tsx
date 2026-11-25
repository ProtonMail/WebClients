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
        vi.useFakeTimers({ shouldAdvanceTime: true });
        timerUserEvent = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
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

    it('should describe the child with the tooltip by default', () => {
        render(
            <Tooltip title="World">
                <button type="button" aria-describedby="existing">
                    Hello
                </button>
            </Tooltip>
        );
        const ids = screen.getByRole('button').getAttribute('aria-describedby')?.split(' ');
        expect(ids).toHaveLength(2);
        expect(ids?.[0]).toBe('existing');
    });

    it('should not describe the child when describeChild is false', () => {
        render(
            <>
                <Tooltip title="World" describeChild={false}>
                    <button type="button">Hello</button>
                </Tooltip>
                <Tooltip title="World" describeChild={false}>
                    <button type="button" aria-describedby="existing">
                        Other
                    </button>
                </Tooltip>
            </>
        );
        expect(screen.getByRole('button', { name: 'Hello' })).not.toHaveAttribute('aria-describedby');
        expect(screen.getByRole('button', { name: 'Other' })).toHaveAttribute('aria-describedby', 'existing');
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

    describe('Escape', () => {
        it('should close the tooltip and keep Escape from reaching parents only while open', async () => {
            const onParentKeyDown = vi.fn();
            const { container } = render(
                <Tooltip title={<span data-testid="tooltip">World</span>}>
                    <button type="button">Hello</button>
                </Tooltip>
            );
            container.addEventListener('keydown', onParentKeyDown);

            await timerUserEvent.tab();
            expect(screen.getByTestId('tooltip')).toHaveTextContent('World');

            await timerUserEvent.keyboard('{Escape}');
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-out' });
            expect(screen.queryByTestId('tooltip')).toBeNull();
            expect(onParentKeyDown).not.toHaveBeenCalled();

            await timerUserEvent.keyboard('{Escape}');
            expect(onParentKeyDown).toHaveBeenCalledTimes(1);
        });

        it('should close a hovered tooltip without moving focus or pointer', async () => {
            render(
                <Tooltip title={<span data-testid="tooltip">World</span>}>
                    <span data-testid="span">Hello</span>
                </Tooltip>
            );

            await timerUserEvent.hover(screen.getByTestId('span'));
            act(() => {
                vi.advanceTimersByTime(1000);
            });
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-in-first' });

            await timerUserEvent.keyboard('{Escape}');
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-out' });
            expect(screen.queryByTestId('tooltip')).toBeNull();
        });

        it('should not close an externally opened tooltip', async () => {
            render(
                <Tooltip title={<span data-testid="tooltip">World</span>} isOpen>
                    <span>Hello</span>
                </Tooltip>
            );

            await timerUserEvent.keyboard('{Escape}');
            act(() => {
                vi.advanceTimersByTime(500);
            });
            expect(screen.getByTestId('tooltip')).toHaveTextContent('World');
        });
    });

    describe('Escape with focus elsewhere', () => {
        it('should close a hovered tooltip and still let the focused element handle Escape', async () => {
            const onInputKeyDown = vi.fn();
            render(
                <>
                    <input aria-label="Search" onKeyDown={onInputKeyDown} />
                    <Tooltip title={<span data-testid="tooltip">World</span>}>
                        <span data-testid="span">Hello</span>
                    </Tooltip>
                </>
            );

            act(() => screen.getByRole('textbox', { name: 'Search' }).focus());
            await timerUserEvent.hover(screen.getByTestId('span'));
            act(() => {
                vi.advanceTimersByTime(1000);
            });

            await timerUserEvent.keyboard('{Escape}');
            expect(onInputKeyDown).toHaveBeenCalledTimes(1);
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-out' });
            expect(screen.queryByTestId('tooltip')).toBeNull();
        });

        it('should stop listening for Escape once unmounted while open', async () => {
            const onParentKeyDown = vi.fn();
            const { container, rerender } = render(
                <Tooltip title="World">
                    <button type="button">Hello</button>
                </Tooltip>
            );
            container.addEventListener('keydown', onParentKeyDown);
            await timerUserEvent.tab();

            rerender(<button type="button">Hello</button>);
            await timerUserEvent.tab();
            await timerUserEvent.keyboard('{Escape}');
            expect(onParentKeyDown).toHaveBeenCalledTimes(1);
        });
    });

    describe('hovering the tooltip', () => {
        it('should leave time to reach the tooltip even with closeDelay={0}', async () => {
            render(
                <Tooltip title={<span data-testid="tooltip">World</span>} openDelay={0} closeDelay={0}>
                    <span data-testid="span">Hello</span>
                </Tooltip>
            );

            await timerUserEvent.hover(screen.getByTestId('span'));
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-in' });

            await timerUserEvent.unhover(screen.getByTestId('span'));
            expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip-out');
            await timerUserEvent.hover(screen.getByRole('tooltip'));
            act(() => {
                vi.advanceTimersByTime(500);
            });
            expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip-out');
            expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip-out-last');

            await timerUserEvent.unhover(screen.getByRole('tooltip'));
            act(() => {
                vi.advanceTimersByTime(100);
            });
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-out-last' });
            expect(screen.queryByTestId('tooltip')).toBeNull();
        });

        it('should keep a focus-opened tooltip open when the pointer passes over it', async () => {
            render(
                <Tooltip title={<span data-testid="tooltip">World</span>}>
                    <button type="button">Hello</button>
                </Tooltip>
            );

            await timerUserEvent.tab();
            fireEvent.animationEnd(screen.getByRole('tooltip'), { animationName: 'anime-tooltip-in' });
            await timerUserEvent.hover(screen.getByRole('tooltip'));
            // Already open: hovering it must not replay the opening animation
            expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip-in');
            await timerUserEvent.unhover(screen.getByRole('tooltip'));
            act(() => {
                vi.advanceTimersByTime(500);
            });

            expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip-out');
            expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip-out-last');
        });

        it('should close when the tooltip itself is tapped', async () => {
            render(
                <Tooltip title={<span data-testid="tooltip">World</span>} openDelay={0}>
                    <span data-testid="span">Hello</span>
                </Tooltip>
            );

            await timerUserEvent.hover(screen.getByTestId('span'));
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-in' });

            // A tap fires touch pointer events and touch events, then compatibility mouse events
            const tooltip = screen.getByRole('tooltip');
            fireEvent.pointerEnter(tooltip, { pointerType: 'touch' });
            fireEvent.touchStart(tooltip);
            fireEvent.pointerLeave(tooltip, { pointerType: 'touch' });
            fireEvent.touchEnd(tooltip);
            fireEvent.mouseEnter(tooltip);
            act(() => {
                vi.advanceTimersByTime(500);
            });
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-out-last' });

            expect(screen.queryByTestId('tooltip')).toBeNull();
        });

        it('should stay open while the pointer is on the tooltip', async () => {
            render(
                <Tooltip title={<span data-testid="tooltip">World</span>}>
                    <span data-testid="span">Hello</span>
                </Tooltip>
            );

            await timerUserEvent.hover(screen.getByTestId('span'));
            act(() => {
                vi.advanceTimersByTime(1000);
            });
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-in-first' });

            await timerUserEvent.unhover(screen.getByTestId('span'));
            await timerUserEvent.hover(screen.getByRole('tooltip'));
            act(() => {
                vi.advanceTimersByTime(500);
            });
            expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip-out-last');
            expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip-out');

            await timerUserEvent.unhover(screen.getByRole('tooltip'));
            act(() => {
                vi.advanceTimersByTime(500);
            });
            fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-out-last' });
            expect(screen.queryByTestId('tooltip')).toBeNull();
        });
    });
});
