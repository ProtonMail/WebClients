import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Tooltip from './Tooltip';

describe('tooltip', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
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

    it('should show and hide tooltip with a delay', async () => {
        render(
            <Tooltip title={<span data-testid="tooltip">World</span>}>
                <span data-testid="span">Hello</span>
            </Tooltip>
        );
        expect(screen.getByTestId('span')).toHaveTextContent('Hello');
        expect(screen.queryByTestId('tooltip')).toBeNull();

        await userEvent.hover(screen.getByTestId('span'));

        expect(screen.queryByTestId('tooltip')).toBeNull();
        await act(() => {
            jest.advanceTimersByTime(1000);
        });

        fireEvent.animationEnd(screen.getByTestId('tooltip'), { animationName: 'anime-tooltip-in-first' });
        expect(screen.getByTestId('tooltip')).toHaveTextContent('World');
        await userEvent.unhover(screen.getByTestId('span'));
        expect(screen.getByTestId('tooltip')).toHaveTextContent('World');

        await act(() => {
            jest.advanceTimersByTime(500);
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

        await userEvent.hover(screen.getByTestId('span-1'));

        expect(screen.queryByTestId('tooltip-1')).toBeNull();
        expect(screen.queryByTestId('tooltip-2')).toBeNull();
        await act(() => {
            jest.advanceTimersByTime(1000);
        });

        fireEvent.animationEnd(screen.getByTestId('tooltip-1'), { animationName: 'anime-tooltip-in-first' });
        expect(screen.getByTestId('tooltip-1')).toHaveTextContent('World');
        expect(screen.queryByTestId('tooltip-2')).toBeNull();

        await userEvent.unhover(screen.getByTestId('span-1'));
        expect(screen.getByTestId('tooltip-1')).toHaveTextContent('World');
        expect(screen.queryByTestId('tooltip-2')).toBeNull();

        await userEvent.hover(screen.getByTestId('span-2'));
        fireEvent.animationEnd(screen.getByTestId('tooltip-1'), { animationName: 'anime-tooltip-out' });
        expect(screen.queryByTestId('tooltip-1')).toBeNull();
        fireEvent.animationEnd(screen.getByTestId('tooltip-2'), { animationName: 'anime-tooltip-in' });
        expect(screen.getByTestId('tooltip-2')).toHaveTextContent('Bar');

        await userEvent.unhover(screen.getByTestId('span-2'));
        await act(() => {
            jest.advanceTimersByTime(500);
        });
        expect(screen.queryByTestId('tooltip-1')).toBeNull();
        fireEvent.animationEnd(screen.getByTestId('tooltip-2'), { animationName: 'anime-tooltip-out-last' });
        expect(screen.queryByTestId('tooltip-2')).toBeNull();
    });
});
