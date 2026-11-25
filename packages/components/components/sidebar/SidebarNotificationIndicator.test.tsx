import { act, fireEvent, render, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import userEvent from '@testing-library/user-event';

import { ThemeColor } from '@proton/colors/types';

import { SidebarNotificationIndicator } from './SidebarNotificationIndicator';

describe('SidebarNotificationIndicator', () => {
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

    it('shows its label in a tooltip on hover', async () => {
        const { container } = render(
            <SidebarNotificationIndicator color={ThemeColor.Danger} label="Some of your data is locked." />
        );

        await timerUserEvent.hover(container.querySelector('svg')!);
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        const tooltip = screen.getByRole('tooltip');
        fireEvent.animationEnd(tooltip, { animationName: 'anime-tooltip-in-first' });

        expect(tooltip).toHaveTextContent('Some of your data is locked.');
    });

    it('reads its label to screen readers', () => {
        render(<SidebarNotificationIndicator color={ThemeColor.Danger} label="Some of your data is locked." />);

        expect(screen.getByText('Some of your data is locked.')).toHaveClass('sr-only');
    });

    it('falls back to a generic label', () => {
        render(<SidebarNotificationIndicator color={ThemeColor.Warning} />);

        expect(screen.getByText('Attention required')).toHaveClass('sr-only');
    });
});
