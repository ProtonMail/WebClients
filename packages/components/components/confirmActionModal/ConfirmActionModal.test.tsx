import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConfirmActionModal from './ConfirmActionModal';

const renderModal = () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    render(
        <ConfirmActionModal open onClose={onClose} onExit={jest.fn()} onSubmit={onSubmit} message="Archive?" canUndo />
    );

    return { onSubmit, onClose };
};

const focus = (element: HTMLElement) => act(() => element.focus());

describe('ConfirmActionModal hotkeys', () => {
    it('submits on Enter while the modal itself has focus', async () => {
        const { onSubmit } = renderModal();
        const dialog = document.querySelector<HTMLElement>('.modal-two-dialog')!;
        focus(dialog);

        await act(async () => {
            fireEvent.keyDown(dialog, { key: 'Enter' });
        });

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it.each(['{Enter}', ' '])('does not submit when %s is pressed on the focused Cancel button', async (key) => {
        const { onSubmit, onClose } = renderModal();
        focus(screen.getByRole('button', { name: 'Cancel', hidden: true }));

        await userEvent.keyboard(key);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('submits once when Enter is pressed on the focused Submit button', async () => {
        const { onSubmit } = renderModal();
        focus(screen.getByRole('button', { name: 'Submit', hidden: true }));

        await userEvent.keyboard('{Enter}');

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
