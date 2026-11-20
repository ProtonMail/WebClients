import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { GlobalModalProvider } from './GlobalModalProvider';
import { useMailGlobalModals } from './globalModalContext';
import type { ModalPayload } from './inteface';
import { ModalType } from './inteface';

jest.mock('@proton/mail/hooks/useUpdateMailSetting', () => ({
    useUpdateMailSetting: () => ({ update: jest.fn() }),
}));

// Simulates a chunk that can't be downloaded
jest.mock('./GlobalScheduleModal', () => {
    throw new Error('Loading chunk failed');
});

const payloads = {
    snooze: { type: ModalType.Snooze, value: { onConfirm: jest.fn() } },
    schedule: { type: ModalType.Schedule, value: { isMessage: true, onConfirm: jest.fn() } },
    unsubscribe: {
        type: ModalType.Unsubscribe,
        value: { isMessage: true, elementLength: 1, onConfirm: jest.fn() },
    },
} satisfies Record<string, ModalPayload>;

const Buttons = () => {
    const { notify } = useMailGlobalModals();

    return (
        <>
            {Object.entries(payloads).map(([name, payload]) => (
                <button key={name} onClick={() => notify(payload)}>
                    open {name}
                </button>
            ))}
        </>
    );
};

const renderProvider = () =>
    render(
        <GlobalModalProvider>
            <Buttons />
        </GlobalModalProvider>
    );

const finishClosing = () => {
    // Mail's jsdom has no AnimationEvent, so fireEvent.animationEnd would drop the animation name
    const event = new Event('animationend', { bubbles: true });
    Object.assign(event, { animationName: 'anime-modal-two-out' });
    fireEvent(document.querySelector('.modal-two--out') as Element, event);
};

describe('GlobalModalProvider', () => {
    it('should not render any modal until one is requested', () => {
        renderProvider();

        expect(document.querySelector('dialog')).not.toBeInTheDocument();
    });

    it.each([
        ['snooze', 'Snoozing this conversation will be canceled.'],
        ['unsubscribe', 'This message will be marked as spam. Would you also like to unsubscribe from future emails?'],
    ])('should mount the %s modal only', async (name, text) => {
        renderProvider();

        fireEvent.click(screen.getByText(`open ${name}`));

        expect(await screen.findByText(text)).toBeInTheDocument();
        expect(document.querySelectorAll('dialog')).toHaveLength(1);
    });

    it('should unmount the modal once it is closed', async () => {
        renderProvider();
        fireEvent.click(screen.getByText('open snooze'));
        fireEvent.click(await screen.findByTestId('cancel-button'));

        finishClosing();

        expect(document.querySelector('dialog')).not.toBeInTheDocument();
    });

    it('should queue a modal requested while another one is open, and show it once the first is gone', async () => {
        renderProvider();
        fireEvent.click(screen.getByText('open snooze'));
        await screen.findByTestId('cancel-button');

        fireEvent.click(screen.getByText('open unsubscribe'));

        expect(document.querySelectorAll('dialog')).toHaveLength(1);
        expect(screen.queryByTestId('confirm-spam-unsub-button')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId('cancel-button'));
        finishClosing();

        expect(await screen.findByTestId('confirm-spam-unsub-button')).toBeInTheDocument();
        expect(screen.queryByText('Snoozing this conversation will be canceled.')).not.toBeInTheDocument();
    });

    it('should start from a clean state when the same modal is requested twice', async () => {
        renderProvider();
        fireEvent.click(screen.getByText('open snooze'));
        fireEvent.click(screen.getByText('open snooze'));
        fireEvent.click(await screen.findByLabelText("Don't ask again"));
        expect(screen.getByLabelText("Don't ask again")).toBeChecked();

        fireEvent.click(screen.getByTestId('confirm-button'));
        finishClosing();

        expect(await screen.findByLabelText("Don't ask again")).not.toBeChecked();
    });

    it('should drop a modal that fails to load and keep working', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        renderProvider();

        fireEvent.click(screen.getByText('open schedule'));
        await waitFor(() => expect(consoleError).toHaveBeenCalled());
        expect(document.querySelector('dialog')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('open snooze'));

        expect(await screen.findByText('Snoozing this conversation will be canceled.')).toBeInTheDocument();
        consoleError.mockRestore();
    });
});
