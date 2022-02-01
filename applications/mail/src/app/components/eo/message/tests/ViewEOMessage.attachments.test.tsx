import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { fireEvent, within } from '@testing-library/dom';
import { setup } from './ViewEOMessage.test.helpers';
import { EOClearAll } from '../../../../helpers/test/eo/helpers';
import { assertIcon } from '../../../../helpers/test/assertion';
import { tick } from '../../../../helpers/test/render';

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

    afterEach(EOClearAll);

    it('should show EO attachments with their correct icon', async () => {
        const { getAllByTestId } = await setup({ attachments: Attachments, numAttachments: NumAttachments });

        const items = getAllByTestId('attachment-item');
        expect(items.length).toBe(NumAttachments);
        for (let i = 0; i < NumAttachments; i++) {
            const { getByText } = within(items[i]);
            getByText(Attachments[i].nameSplitStart);
            getByText(Attachments[i].nameSplitEnd);
            getByText(Attachments[i].Size, { exact: false });
            assertIcon(items[i].querySelector('svg'), icons[i], undefined, 'mime');
        }
    });

    it('should show global size and counters', async () => {
        const body = '<div><img src="cid:cid-embedded"/></div>';
        const { getByTestId } = await setup({ attachments: Attachments, numAttachments: NumAttachments, body: body });

        const header = getByTestId('attachments-header');

        expect(header.textContent).toMatch(String(totalSize));
        expect(header.textContent).toMatch(/2\s*files/);
        expect(header.textContent).toMatch(/1\s*embedded/);
    });

    it('should open preview when clicking', async () => {
        const { getAllByTestId } = await setup({ attachments: Attachments, numAttachments: NumAttachments });

        const items = getAllByTestId('attachment-item');
        const itemButton = items[2].querySelectorAll('button')[1];

        fireEvent.click(itemButton);
        await tick();

        const preview = document.querySelector('.file-preview');

        expect(preview).toBeDefined();
        expect(preview?.textContent).toMatch(new RegExp(attachment3.Name));
        expect(preview?.textContent).toMatch(/3of3/);
    });
});
