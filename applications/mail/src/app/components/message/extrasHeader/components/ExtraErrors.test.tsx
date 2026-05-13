import { render, screen } from '@testing-library/react';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import ExtraErrors from './ExtraErrors';

jest.mock('../../../../hooks/message/useLoadMessage', () => ({
    useReloadMessage: () => jest.fn(),
}));

describe('Errors banner', () => {
    it('should show error banner for network error', () => {
        const message = { localID: 'localID', errors: { network: [new Error('test')] } } as MessageState;
        render(<ExtraErrors message={message} />);
        expect(screen.getByTestId('errors-banner').textContent).toMatch(/Network error/);
    });

    it('should show error banner for decryption error', () => {
        const message = { localID: 'localID', errors: { decryption: [new Error('test')] } } as MessageState;
        render(<ExtraErrors message={message} />);
        expect(screen.getByTestId('errors-banner').textContent).toMatch(/Decryption error/);
    });

    it('should show error banner for processing error', () => {
        const message = { localID: 'localID', errors: { processing: [new Error('test')] } } as MessageState;
        render(<ExtraErrors message={message} />);
        expect(screen.getByTestId('errors-banner').textContent).toMatch(/processing error/);
    });

    it('should show error banner for signature error', () => {
        const message = { localID: 'localID', errors: { signature: [new Error('test')] } } as MessageState;
        render(<ExtraErrors message={message} />);
        expect(screen.getByTestId('errors-banner').textContent).toMatch(/Signature verification error/);
    });
});
