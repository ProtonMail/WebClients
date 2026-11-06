import { expect } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SignInRestrictionConfirmModal from './SignInRestrictionConfirmModal';

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

const renderModal = () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    render(
        <SignInRestrictionConfirmModal
            open
            onClose={onClose}
            onConfirm={onConfirm}
            identifiers={{ username: 'eric', primaryEmail: 'eric@proton.me', signInDomains: ['proton.me'] }}
        />
    );

    return { onConfirm, onClose };
};

const focus = (element: HTMLElement) => act(() => element.focus());

describe('SignInRestrictionConfirmModal', () => {
    it.each(['{Enter}', ' '])(
        'cancels without confirming when %s is pressed on the focused Cancel button',
        async (key) => {
            const { onConfirm, onClose } = renderModal();
            focus(screen.getByRole('button', { name: 'Cancel', hidden: true }));

            await userEvent.keyboard(key);

            expect(onConfirm).not.toHaveBeenCalled();
            expect(onClose).toHaveBeenCalledTimes(1);
        }
    );

    it.each(['{Enter}', ' '])('confirms once when %s is pressed on the focused confirm button', async (key) => {
        const { onConfirm, onClose } = renderModal();
        focus(screen.getByRole('button', { name: 'Restrict sign-in', hidden: true }));

        await userEvent.keyboard(key);

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('confirms when Enter is pressed while no button has focus', async () => {
        const { onConfirm } = renderModal();
        focus(screen.getByRole('dialog', { hidden: true }));

        await userEvent.keyboard('{Enter}');

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
