import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ScreenShareError } from '../../hooks/screenShare/useCurrentScreenShare';
import { ScreenShareErrorModal } from './ScreenShareErrorModal';

// ModalTwo renders <dialog> without `open` and shows it through the app's CSS, which happy-dom does not load,
// so happy-dom's default `display: none` for a <dialog> without `open` would hide it from role queries.
beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.appendChild(style);
});

const renderModal = (error: ScreenShareError) => {
    const onRetry = vi.fn();
    const onClose = vi.fn();
    render(<ScreenShareErrorModal error={error} onRetry={onRetry} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    return { onRetry, onClose, dialog };
};

describe('ScreenShareErrorModal', () => {
    describe('when screen recording is off for Firefox', () => {
        it('names the setting to turn on, with the settings path in bold', () => {
            const { dialog } = renderModal('screenRecordingOff');

            expect(dialog).toHaveAccessibleName('Firefox can’t record your screen');
            // happy-dom pads the inline <strong> with spaces when it computes the accessible description, so read the text.
            const description = document.getElementById(dialog.getAttribute('aria-describedby') ?? '');
            expect(description?.textContent).toBe(
                'Turn on Firefox in System Settings → Privacy & Security → Screen Recording. Then restart Firefox and rejoin the call.'
            );
            expect(within(dialog).getByText('System Settings → Privacy & Security → Screen Recording').tagName).toBe(
                'STRONG'
            );
        });

        it('offers only Close, which calls onClose', async () => {
            const { dialog, onClose, onRetry } = renderModal('screenRecordingOff');

            const buttons = within(dialog).getAllByRole('button');
            expect(buttons).toHaveLength(1);
            expect(buttons[0]).toHaveAccessibleName('Close');

            await userEvent.click(buttons[0]);

            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onRetry).not.toHaveBeenCalled();
        });
    });

    describe.each([
        {
            error: 'nothingToShare' as const,
            title: 'No screen or window found',
            message: 'Open the window you want to share, then try again.',
        },
        {
            error: 'failed' as const,
            title: 'Screen share failed',
            message: 'Something went wrong. Please try again.',
        },
    ])('when the error is $error', ({ error, title, message }) => {
        it('shows its title and next step', () => {
            const { dialog } = renderModal(error);

            expect(dialog).toHaveAccessibleName(title);
            expect(dialog).toHaveAccessibleDescription(message);
        });

        it('offers Try again then Close', () => {
            const { dialog } = renderModal(error);

            expect(
                within(dialog)
                    .getAllByRole('button')
                    .map((button) => button.textContent)
            ).toEqual(['Try again', 'Close']);
        });

        it('calls onRetry from Try again', async () => {
            const { dialog, onRetry, onClose } = renderModal(error);

            await userEvent.click(within(dialog).getByRole('button', { name: 'Try again' }));

            expect(onRetry).toHaveBeenCalledTimes(1);
            expect(onClose).not.toHaveBeenCalled();
        });

        it('calls onClose from Close', async () => {
            const { dialog, onRetry, onClose } = renderModal(error);

            await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onRetry).not.toHaveBeenCalled();
        });
    });

    it.each(['screenRecordingOff', 'nothingToShare', 'failed'] as const)(
        'keeps the %s illustration out of the accessibility tree',
        (error) => {
            const { dialog } = renderModal(error);

            expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
            expect(dialog.querySelector('img')).toHaveAttribute('alt', '');
        }
    );
});
