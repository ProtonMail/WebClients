import { act, fireEvent, screen } from '@testing-library/react';

import { wait } from '@proton/shared/lib/helpers/promise';
import { EO_REPLY_NUM_ATTACHMENTS_LIMIT } from '@proton/shared/lib/mail/eo/constants';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';
import { EOClearAll, EOSubject } from '../../../../helpers/test/eo/helpers';
import { waitForNotification } from '../../../../helpers/test/helper';
import { tick } from '../../../../helpers/test/render';
import { setup } from './EOReply.test.helpers';

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
        await setup();

        await screen.findByText(EOSubject);

        const inputAttachment = screen.getByTestId('composer-attachments-button') as HTMLInputElement;
        fireEvent.change(inputAttachment, { target: { files: [file] } });
        await act(async () => {
            await wait(100);
        });

        const toggleList = await screen.findByTestId('attachment-list:toggle');
        fireEvent.click(toggleList);

        await tick();

        const item = screen.getByTestId('attachment-item').querySelectorAll('button')[1];

        fireEvent.click(item);
        await tick();

        const preview = document.querySelector('.file-preview');

        expect(preview).toBeDefined();
        expect(preview?.textContent).toMatch(new RegExp(fileName));
        screen.getByText(fileContent);
    });

    it('should not be possible to add 10+ attachments', async () => {
        await setup();
        await screen.findByText(EOSubject);

        // Add 11 files
        const inputAttachment = screen.getByTestId('composer-attachments-button') as HTMLInputElement;
        fireEvent.change(inputAttachment, {
            target: { files: [file, file, file, file, file, file, file, file, file, file, file] },
        });
        await act(async () => {
            await wait(100);
        });

        await waitForNotification(`Maximum number of attachments (${EO_REPLY_NUM_ATTACHMENTS_LIMIT}) exceeded`);
    });
});
