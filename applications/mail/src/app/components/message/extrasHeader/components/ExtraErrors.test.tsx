import { screen } from '@testing-library/react';

import type { MessageErrors, MessageState } from '@proton/mail/store/messages/messagesTypes';

import { mailTestRender } from '../../../../helpers/test/helper';
import ExtraErrors from './ExtraErrors';

describe('Errors banner', () => {
    const setup = async (errors: MessageErrors) => {
        const message = { localID: 'localID', errors } as MessageState;
        await mailTestRender(<ExtraErrors message={message} />);
        return screen.getByTestId('errors-banner');
    };

    it('should show error banner for network error', async () => {
        const banner = await setup({ network: [new Error('test')] });
        expect(banner.textContent).toMatch(/Network error/);
    });

    it('should show error banner for decryption error', async () => {
        const banner = await setup({ decryption: [new Error('test')] });
        expect(banner.textContent).toMatch(/Decryption error/);
    });

    it('should show error banner for processing error', async () => {
        const banner = await setup({ processing: [new Error('test')] });
        expect(banner.textContent).toMatch(/processing error/);
    });

    it('should show error banner for signature error', async () => {
        const banner = await setup({ signature: [new Error('test')] });
        expect(banner.textContent).toMatch(/Signature verification error/);
    });
});
