import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { JoinError } from '@proton/meet/store/slices/uiStateSlice';

import { JoinErrorModal } from './JoinErrorModal';

const mocks = vi.hoisted(() => ({
    isFirefox: vi.fn(() => false),
    isMobile: vi.fn(() => false),
}));

vi.mock('@proton/shared/lib/helpers/browser', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    isFirefox: mocks.isFirefox,
    isMobile: mocks.isMobile,
}));

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

const webRtcAdvice =
    'Proton Meet needs WebRTC, which is off or blocked in this browser. Turn it on, turn off extensions that block it, or use another browser.';

const getImageSize = (dialog: HTMLElement) => {
    const image = dialog.querySelector('img');
    return [image?.style.getPropertyValue('--w-custom'), image?.style.getPropertyValue('--h-custom')];
};

beforeEach(() => {
    mocks.isFirefox.mockReturnValue(false);
    mocks.isMobile.mockReturnValue(false);
});

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
        {
            joinError: 'meetingNotAllowed' as const,
            title: 'Couldn’t start the meeting',
            message: 'The host has another meeting in progress.',
        },
        {
            joinError: 'meetingLocked' as const,
            title: 'Meeting locked',
            message: 'Ask the host to unlock it so you can join.',
        },
        {
            joinError: 'webRtcUnsupported' as const,
            title: 'Browser not supported',
            message: webRtcAdvice,
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
        'meetingNotAllowed',
        'meetingLocked',
        'webRtcUnsupported',
    ] as const)('keeps the %s illustration out of the accessibility tree', (joinError) => {
        const { dialog } = renderModal(joinError);

        expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
        expect(dialog.querySelector('img')).toHaveAttribute('alt', '');
    });

    describe('when the browser does not support WebRTC', () => {
        it('adds the Firefox setting to the advice, with the technical values in bold, on Firefox', () => {
            mocks.isFirefox.mockReturnValue(true);
            const { dialog } = renderModal('webRtcUnsupported');

            expect(dialog).toHaveAccessibleDescription(
                expect.stringContaining(
                    `${webRtcAdvice} In Firefox, open about:config and set media.peerconnection.enabled to true`
                )
            );
            expect(
                within(dialog)
                    .getAllByRole('strong')
                    .map((element) => element.textContent)
            ).toEqual(['about:config', 'media.peerconnection.enabled', 'true']);
        });

        it.each([
            { device: 'phones', isMobile: true, size: '3rem' },
            { device: 'desktop', isMobile: false, size: '5rem' },
        ])('shows the warning at $size on $device', ({ isMobile, size }) => {
            mocks.isMobile.mockReturnValue(isMobile);
            const { dialog } = renderModal('webRtcUnsupported');

            expect(getImageSize(dialog)).toEqual([size, size]);
        });
    });

    it.each([true, false])('shows the lock at 7.5rem whether on a phone or not (%s)', (isMobile) => {
        mocks.isMobile.mockReturnValue(isMobile);
        const { dialog } = renderModal('meetingLocked');

        expect(getImageSize(dialog)).toEqual(['7.5rem', '7.5rem']);
    });

    it('shows the other illustrations at 5rem', () => {
        const { dialog } = renderModal('joinFailed');

        expect(getImageSize(dialog)).toEqual(['5rem', '5rem']);
    });
});
