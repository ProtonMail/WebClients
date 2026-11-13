import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';

import { CircleButton } from './CircleButton';

describe('CircleButton', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should call onClick and not be aria-disabled when it is not loading', async () => {
        const onClick = vi.fn();

        render(<CircleButton IconComponent={IcMeetCamera} ariaLabel="Turn off camera" onClick={onClick} />);

        const button = screen.getByRole('button', { name: 'Turn off camera' });
        await userEvent.setup().click(button);

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('describes the button with the indicator description and keeps its label as name', () => {
        render(
            <CircleButton
                IconComponent={IcMeetCamera}
                ariaLabel="Toggle participants"
                indicatorContent="10"
                indicatorStatus="danger"
                indicatorDescription="Meeting full"
            />
        );

        expect(screen.getByRole('button', { name: 'Toggle participants' })).toHaveAccessibleDescription('Meeting full');
    });

    it('has no description without an indicator description', () => {
        render(<CircleButton IconComponent={IcMeetCamera} ariaLabel="Toggle participants" indicatorContent="10" />);

        expect(screen.getByRole('button', { name: 'Toggle participants' })).toHaveAccessibleDescription('');
    });

    it('should stay focusable, be aria-disabled and ignore clicks while loading', async () => {
        const onClick = vi.fn();

        render(<CircleButton IconComponent={IcMeetCamera} ariaLabel="Turn on camera" onClick={onClick} loading />);

        const button = screen.getByRole('button', { name: 'Turn on camera' });
        const user = userEvent.setup();
        await user.tab();
        await user.keyboard('{Enter}');

        expect(button).toBeEnabled();
        expect(button).toHaveFocus();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(onClick).not.toHaveBeenCalled();
    });

    it('keeps the same focused button when its tooltip is disabled and enabled again', () => {
        const renderButton = (tooltipDisabled: boolean) => (
            <CircleButton
                IconComponent={IcMeetCamera}
                ariaLabel="More options"
                tooltipTitle="More options"
                tooltipDisabled={tooltipDisabled}
            />
        );
        const { rerender } = render(renderButton(false));
        const button = screen.getByRole('button', { name: 'More options' });
        act(() => button.focus());

        rerender(renderButton(true));
        expect(screen.getByRole('button', { name: 'More options' })).toBe(button);
        expect(button).toHaveFocus();

        rerender(renderButton(false));
        expect(screen.getByRole('button', { name: 'More options' })).toBe(button);
        expect(button).toHaveFocus();
    });

    it('shows its tooltip on hover only while the tooltip is not disabled', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const renderButton = (tooltipDisabled: boolean) => (
            <CircleButton
                IconComponent={IcMeetCamera}
                ariaLabel="More options"
                tooltipTitle="Show more options"
                tooltipDisabled={tooltipDisabled}
            />
        );
        const { rerender } = render(renderButton(true));
        const button = screen.getByRole('button', { name: 'More options' });

        await user.hover(button);
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

        await user.unhover(button);
        rerender(renderButton(false));
        await user.hover(button);
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getByRole('tooltip')).toHaveTextContent('Show more options');
    });
});
