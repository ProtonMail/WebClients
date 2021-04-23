import { fireEvent, within } from '@testing-library/dom';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { createEmbeddedMap } from '../../../helpers/embedded/embeddeds';
import { assertIcon } from '../../../helpers/test/assertion';
import { tick } from '../../../helpers/test/helper';
import { initMessage, setup } from './Message.test.helpers';

describe('Message attachments', () => {
    const attachment1 = { ID: 'id1', Name: 'attachment-name-unknown', Size: 100 };
    const attachment2 = { ID: 'id2', Name: 'attachment-name-pdf.pdf', Size: 200, MIMEType: 'application/pdf' };
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
    };
    const Attachments = [attachment1, attachment2, attachment3];
    const NumAttachments = Attachments.length;
    const icons = ['file-unknown', 'file-pdf', 'file-image'];
    const totalSize = Attachments.map((attachment) => attachment.Size).reduce((acc, size) => acc + size, 0);

    it('should show attachments with their correct icon', async () => {
        initMessage({ data: { NumAttachments, Attachments } });

        const { getAllByTestId } = await setup();

        const items = getAllByTestId('attachment-item');

        expect(items.length).toBe(NumAttachments);
        for (let i = 0; i < NumAttachments; i++) {
            const { getByText } = within(items[i]);
            getByText(Attachments[i].Name);
            getByText(Attachments[i].Size, { exact: false });
            assertIcon(items[i].querySelector('svg'), icons[i]);
        }
    });

    it('should show global size and counters', async () => {
        const cid = 'cid';
        const url = 'url';
        const embeddeds = createEmbeddedMap();
        embeddeds.set(cid, { attachment: attachment1, url });

        initMessage({ data: { NumAttachments, Attachments }, embeddeds });

        const { getByTestId } = await setup();

        const header = getByTestId('attachments-header');

        expect(header.textContent).toMatch(String(totalSize));
        expect(header.textContent).toMatch(/2\s*files/);
        expect(header.textContent).toMatch(/1\s*embedded/);
    });

    it('should open preview when clicking', async () => {
        initMessage({ data: { NumAttachments, Attachments } });

        const { getAllByTestId, container } = await setup();

        const items = getAllByTestId('attachment-item');
        const itemButton = items[2].querySelectorAll('button')[1];

        fireEvent.click(itemButton);
        await tick();

        const preview = container.querySelector('.file-preview');

        expect(preview).toBeDefined();
        expect(preview?.textContent).toMatch(new RegExp(attachment3.Name));
        expect(preview?.textContent).toMatch(/3of3/);
    });
});
