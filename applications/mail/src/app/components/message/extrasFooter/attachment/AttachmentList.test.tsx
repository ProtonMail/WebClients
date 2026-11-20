import { fireEvent } from '@testing-library/react';

import { AttachmentAction } from '@proton/mail-composer/attachments/attachmentListTypes';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { mockUseFlag } from '@proton/unleash/testing/vitest/mockUseFlag';

import { clearAll } from '../../../../helpers/tests/helper';
import { createEmbeddedImage, createMessageImages } from '../../../../helpers/tests/message';
import { mailTestRender } from '../../../../helpers/tests/render';
import AttachmentList from './AttachmentList';

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
    onRemoveAttachment: vi.fn(),
    onRemoveUpload: vi.fn(),
};

describe('AttachmentsList', () => {
    afterEach(() => {
        clearAll();
        vi.restoreAllMocks();
    });

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

    it('should offer the download button for attachments that cannot be previewed', async () => {
        const archive = { ID: 'ID3', Name: 'archive.zip', MIMEType: 'application/zip' } as Attachment;
        const { getByTestId } = await mailTestRender(
            <AttachmentList
                {...props}
                message={{ ...props.message, messageImages: createMessageImages([]) }}
                attachments={[archive]}
                primaryAction={AttachmentAction.Preview}
                secondaryAction={AttachmentAction.Download}
                collapsable={false}
            />
        );

        expect(getByTestId('attachment-item:archive.zip--secondary-action')).toHaveAttribute(
            'title',
            'Download archive.zip'
        );
    });

    describe('Save to Drive', () => {
        const archive = { ID: 'ID3', Name: 'archive.zip', MIMEType: 'application/zip' } as Attachment;

        const renderWithSaveHandler = (onSaveToDrive: (attachment: Attachment) => Promise<void>) => {
            return mailTestRender(
                <AttachmentList
                    {...props}
                    message={{ ...props.message, messageImages: createMessageImages([]) }}
                    attachments={[archive]}
                    primaryAction={AttachmentAction.Preview}
                    secondaryAction={AttachmentAction.Download}
                    collapsable={false}
                    onSaveToDrive={onSaveToDrive}
                />
            );
        };

        it("hands a received attachment to the list's save handler when its Save to Drive is clicked", async () => {
            mockUseFlag().mockImplementation((flag) => flag === MailFeatureFlag.MailSaveToDrive);
            const onSaveToDrive = vi.fn(() => Promise.resolve());
            const { getByRole } = await renderWithSaveHandler(onSaveToDrive);

            fireEvent.click(getByRole('button', { name: 'Save archive.zip to Proton Drive' }));

            expect(onSaveToDrive).toHaveBeenCalledWith(archive);
        });

        it('shows no Save to Drive button when the flag is off, even with a save handler', async () => {
            mockUseFlag(false);
            const { getByRole, queryByRole } = await renderWithSaveHandler(vi.fn(() => Promise.resolve()));

            expect(queryByRole('button', { name: 'Save archive.zip to Proton Drive' })).toBeNull();
            expect(getByRole('button', { name: 'Download archive.zip' })).toBeInTheDocument();
        });
    });
});
