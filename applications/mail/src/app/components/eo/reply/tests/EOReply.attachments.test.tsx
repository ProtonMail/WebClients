import { act, fireEvent, waitFor } from '@testing-library/react';
import { wait } from '@proton/shared/lib/helpers/promise';
import { EO_REPLY_NUM_ATTACHMENTS_LIMIT } from '@proton/shared/lib/mail/eo/constants';

import { EOClearAll, EOSubject } from '../../../../helpers/test/eo/helpers';
import { setup } from './EOReply.test.helpers';
import { tick } from '../../../../helpers/test/render';
import { waitForNotification } from '../../../../helpers/test/helper';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';

describe('EO Reply attachments', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(EOClearAll);

    const fileName = 'file.txt';
    const fileType = 'text/plain';
    const fileContent = 'File content';
    const blob = new Blob([fileContent], { type: fileType });
    const file = new File([blob], fileName, { type: fileType });

    it('should add attachments to a EO message and be able to preview them', async () => {
        const { getByText, getByTestId } = await setup();

        await waitFor(() => getByText(EOSubject));

        const inputAttachment = getByTestId('composer-attachments-button') as HTMLInputElement;
        await act(async () => {
            fireEvent.change(inputAttachment, { target: { files: [file] } });
            await wait(100);
        });

        const toggleList = await waitFor(() => getByTestId('attachment-list-toggle'));
        fireEvent.click(toggleList);

        await tick();

        const item = getByTestId('attachment-item').querySelectorAll('button')[1];

        fireEvent.click(item);
        await tick();

        const preview = document.querySelector('.file-preview');

        expect(preview).toBeDefined();
        expect(preview?.textContent).toMatch(new RegExp(fileName));
        getByText(fileContent);
    });

    it('should not be possible to add 10+ attachments', async () => {
        const { getByText, getByTestId } = await setup();

        await waitFor(() => getByText(EOSubject));

        // Add 11 files
        const inputAttachment = getByTestId('composer-attachments-button') as HTMLInputElement;
        await act(async () => {
            fireEvent.change(inputAttachment, {
                target: { files: [file, file, file, file, file, file, file, file, file, file, file] },
            });
            await wait(100);
        });

        await waitForNotification(`Maximum number of attachments (${EO_REPLY_NUM_ATTACHMENTS_LIMIT}) exceeded`);
    });
});
