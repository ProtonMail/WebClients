import { fireEvent, waitFor, within } from '@testing-library/react';

import humanSize from '@proton/shared/lib/helpers/humanSize';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { assertIcon } from '../../../../helpers/test/assertion';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';
import { EOClearAll } from '../../../../helpers/test/eo/helpers';
import { tick } from '../../../../helpers/test/render';
import { setup } from './ViewEOMessage.test.helpers';

describe('Encrypted Outside message attachments', () => {
    const cid = 'cid';
    const attachment1 = {
        ID: 'id1',
        Name: 'attachment-name-unknown',
        Size: 100,
        Headers: { 'content-id': cid },
        nameSplitStart: 'attachment-name-unkn',
        nameSplitEnd: 'own',
    };
    const attachment2 = {
        ID: 'id2',
        Name: 'attachment-name-pdf.pdf',
        Size: 200,
        MIMEType: 'application/pdf',
        nameSplitStart: 'attachment-name-p',
        nameSplitEnd: 'df.pdf',
    };
    const attachment3 = {
        ID: 'id3',
        Name: 'attachment-name-png.png',
        Size: 300,
        MIMEType: 'image/png',
        // Allow to skip actual download of the file content
        Preview: {
            data: [],
            filename: 'preview',
            signatures: [],
            verified: VERIFICATION_STATUS.NOT_SIGNED,
        },
        nameSplitStart: 'attachment-name-p',
        nameSplitEnd: 'ng.png',
        Headers: { 'content-id': 'cid-embedded', 'content-disposition': 'inline' },
    };
    const Attachments = [attachment1, attachment2, attachment3];
    const NumAttachments = Attachments.length;
    const icons = ['md-unknown', 'md-pdf', 'md-image'];
    const totalSize = Attachments.map((attachment) => attachment.Size).reduce((acc, size) => acc + size, 0);

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(EOClearAll);

    it('should show EO attachments with their correct icon', async () => {
        const { getAllByTestId } = await setup({ attachments: Attachments, numAttachments: NumAttachments });

        const items = await waitFor(() => getAllByTestId('attachment-item'));
        expect(items.length).toBe(NumAttachments);
        for (let i = 0; i < NumAttachments; i++) {
            const { getByText, getByTestId } = within(items[i]);
            getByText(Attachments[i].nameSplitStart);
            getByText(Attachments[i].nameSplitEnd);

            const attachmentSizeText = getByTestId('attachment-item:size').textContent;
            expect(attachmentSizeText).toEqual(humanSize(Attachments[i].Size));

            assertIcon(items[i].querySelector('svg'), icons[i], undefined, 'mime');
        }
    });

    it('should show global size and counters', async () => {
        const body = '<div><img src="cid:cid-embedded"/></div>';
        const { getByTestId } = await setup({ attachments: Attachments, numAttachments: NumAttachments, body: body });

        const header = await waitFor(() => getByTestId('attachment-list:header'));

        expect(header.textContent).toMatch(String(totalSize));
        expect(header.textContent).toMatch(/2\s*files/);
        expect(header.textContent).toMatch(/1\s*embedded/);
    });

    it('should open preview when clicking', async () => {
        window.URL.createObjectURL = jest.fn();

        const { getAllByTestId } = await setup({ attachments: Attachments, numAttachments: NumAttachments });

        const items = await waitFor(() => getAllByTestId('attachment-item'));
        const itemButton = items[2].querySelectorAll('button')[1];

        fireEvent.click(itemButton);
        await tick();

        const preview = document.querySelector('.file-preview');

        expect(preview).toBeDefined();
        expect(preview?.textContent).toMatch(new RegExp(attachment3.Name));
        expect(preview?.textContent).toMatch(/3of3/);
    });
});
