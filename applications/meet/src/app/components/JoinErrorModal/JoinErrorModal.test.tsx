import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { JoinError } from '@proton/meet/store/slices/uiStateSlice';

import { JoinErrorModal } from './JoinErrorModal';

// ModalTwo renders <dialog> without `open` and shows it through the app's CSS, which happy-dom does not load,
// so happy-dom's default `display: none` for a <dialog> without `open` would hide it from role queries.
beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.appendChild(style);
});

const renderModal = (joinError: JoinError, { canLeave = false }: { canLeave?: boolean } = {}) => {
    const onRetry = vi.fn();
    const onClose = vi.fn();
    const onLeave = vi.fn();
    render(
        <JoinErrorModal
            joinError={joinError}
            onRetry={onRetry}
            onClose={onClose}
            onLeave={canLeave ? onLeave : undefined}
        />
    );
    const dialog = screen.getByRole('dialog');
    const buttonNames = within(dialog)
        .getAllByRole('button')
        .map((button) => button.textContent);
    return { onRetry, onClose, onLeave, dialog, buttonNames };
};

describe('JoinErrorModal', () => {
    describe.each([
        {
            joinError: 'joinFailed' as const,
            title: 'Couldn’t join the meeting',
            message: 'Something went wrong. Please try again.',
        },
        {
            joinError: 'startFailed' as const,
            title: 'Couldn’t start the meeting',
            message: 'Something went wrong. Please try again.',
        },
    ])('when the error is $joinError', ({ joinError, title, message }) => {
        it('shows its title and next step', () => {
            const { dialog } = renderModal(joinError);

            expect(dialog).toHaveAccessibleName(title);
            expect(dialog).toHaveAccessibleDescription(message);
        });

        it('offers Try again then Close, even when leaving is possible', () => {
            expect(renderModal(joinError, { canLeave: true }).buttonNames).toEqual(['Try again', 'Close']);
        });

        it('calls onRetry from Try again', async () => {
            const { dialog, onRetry, onClose } = renderModal(joinError);

            await userEvent.click(within(dialog).getByRole('button', { name: 'Try again' }));

            expect(onRetry).toHaveBeenCalledTimes(1);
            expect(onClose).not.toHaveBeenCalled();
        });

        it('calls onClose from Close', async () => {
            const { dialog, onRetry, onClose } = renderModal(joinError);

            await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onRetry).not.toHaveBeenCalled();
        });
    });

    describe.each([
        {
            joinError: 'meetingOutdated' as const,
            title: 'Meeting out of date',
            message: 'Ask the host to end the meeting, refresh Proton Meet and start it again.',
        },
        {
            joinError: 'deviceClock' as const,
            title: 'Incorrect date and time',
            message: 'Set your device’s date and time to update automatically, then try again.',
        },
        {
            joinError: 'wrongPassword' as const,
            title: 'Incorrect meeting password',
            message: 'Check that you copied the full meeting link and try again.',
        },
    ])('when the error is $joinError', ({ joinError, title, message }) => {
        it('shows its title and next step', () => {
            const { dialog } = renderModal(joinError);

            expect(dialog).toHaveAccessibleName(title);
            expect(dialog).toHaveAccessibleDescription(message);
        });

        it('offers only Close, which calls onClose', async () => {
            const { dialog, buttonNames, onClose, onRetry } = renderModal(joinError, { canLeave: true });

            expect(buttonNames).toEqual(['Close']);

            await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onRetry).not.toHaveBeenCalled();
        });
    });

    describe('when the connection failed', () => {
        it('shows its title and next step', () => {
            const { dialog } = renderModal('connectionFailed');

            expect(dialog).toHaveAccessibleName('Connection failed');
            expect(dialog).toHaveAccessibleDescription(
                'Check your internet connection and try again. If that doesn’t work, try another browser.'
            );
        });

        it('offers Try again then Leave to someone who can leave', () => {
            expect(renderModal('connectionFailed', { canLeave: true }).buttonNames).toEqual(['Try again', 'Leave']);
        });

        it('offers only Try again to someone who cannot leave', () => {
            expect(renderModal('connectionFailed').buttonNames).toEqual(['Try again']);
        });

        it('calls onLeave from Leave', async () => {
            const { dialog, onLeave, onRetry, onClose } = renderModal('connectionFailed', { canLeave: true });

            await userEvent.click(within(dialog).getByRole('button', { name: 'Leave' }));

            expect(onLeave).toHaveBeenCalledTimes(1);
            expect(onRetry).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
        });

        it('calls onRetry from Try again', async () => {
            const { dialog, onRetry } = renderModal('connectionFailed', { canLeave: true });

            await userEvent.click(within(dialog).getByRole('button', { name: 'Try again' }));

            expect(onRetry).toHaveBeenCalledTimes(1);
        });
    });

    it.each(['joinFailed', 'wrongPassword', 'connectionFailed'] as const)('closes %s on Escape', async (joinError) => {
        const { onClose } = renderModal(joinError);

        await userEvent.keyboard('{Escape}');

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.each([
        'joinFailed',
        'startFailed',
        'meetingOutdated',
        'deviceClock',
        'wrongPassword',
        'connectionFailed',
    ] as const)('keeps the %s illustration out of the accessibility tree', (joinError) => {
        const { dialog } = renderModal(joinError);

        expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
        expect(dialog.querySelector('img')).toHaveAttribute('alt', '');
    });
});
