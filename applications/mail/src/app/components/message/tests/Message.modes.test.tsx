import { act } from '@testing-library/react';

import { addApiResolver, clearAll } from '../../../helpers/test/helper';
import { initMessage, messageID, setup } from './Message.test.helpers';

jest.setTimeout(20000);

describe('Message display modes', () => {
    afterEach(clearAll);

    it('loading mode', async () => {
        addApiResolver(`mail/v4/messages/${messageID}`);

        const { ref, getByTestId } = await setup();

        const messageView = getByTestId('message-view-0');

        act(() => ref.current?.expand());

        const placeholders = messageView.querySelectorAll('.message-content-loading-placeholder');

        expect(placeholders.length).toBeGreaterThanOrEqual(3);
    });

    it('encrypted mode', async () => {
        const encryptedBody = 'body-test';

        initMessage({ data: { Body: encryptedBody }, errors: { decryption: [new Error('test')] } });

        const { getByTestId } = await setup();

        const errorsBanner = getByTestId('errors-banner');
        expect(errorsBanner.textContent).toContain('Decryption error');

        const messageView = getByTestId('message-view-0');
        expect(messageView.textContent).toContain(encryptedBody);
    });

    it('source mode on processing error', async () => {
        const decryptedBody = 'decrypted-test';

        initMessage({
            data: { Body: 'test' },
            errors: { processing: [new Error('test')] },
            decryption: { decryptedBody },
        });

        const { getByTestId } = await setup();

        const errorsBanner = getByTestId('errors-banner');
        expect(errorsBanner.textContent).toContain('processing error');

        const messageView = getByTestId('message-view-0');
        expect(messageView.textContent).toContain(decryptedBody);
    });
});
