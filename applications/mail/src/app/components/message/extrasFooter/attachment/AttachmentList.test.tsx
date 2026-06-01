import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import { clearAll, createEmbeddedImage, createMessageImages, mailTestRender } from '../../../../helpers/test/helper';
import AttachmentList, { AttachmentAction } from './AttachmentList';

const localID = 'localID';
const cid = 'cid';
const normalAttachment = { ID: 'ID1' } as Attachment;
const embeddedAttachment = { ID: 'ID2', Headers: { 'content-id': cid } } as Attachment;
const image = createEmbeddedImage(embeddedAttachment);
const messageImages = createMessageImages([image]);

const props = {
    message: {
        localID,
        data: {} as Message,
        messageImages,
    },
    primaryAction: AttachmentAction.Download,
    secondaryAction: AttachmentAction.Remove,
    collapsable: true,
    onRemoveAttachment: jest.fn(),
    onRemoveUpload: jest.fn(),
};

describe('AttachmentsList', () => {
    afterEach(() => clearAll());

    it('should show attachments count', async () => {
        const messageImages = createMessageImages([]);
        const attachments = [normalAttachment];
        const { getByText, queryByText } = await mailTestRender(
            <AttachmentList {...props} message={{ ...props.message, messageImages }} attachments={attachments} />
        );
        getByText('file attached');
        expect(queryByText('embedded image')).toBe(null);
    });

    it('should show embedded count', async () => {
        const attachments = [embeddedAttachment];
        const { getByText, queryByText } = await mailTestRender(
            <AttachmentList {...props} attachments={attachments} />
        );
        getByText('embedded image');
        expect(queryByText('file attached')).toBe(null);
    });

    it('should show attachments count and embedded count', async () => {
        const attachments = [normalAttachment, embeddedAttachment];
        const { getByText } = await mailTestRender(<AttachmentList {...props} attachments={attachments} />);
        getByText('file attached,');
        getByText('embedded image');
    });
});
