import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import type { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';
import { encryptAttachment } from '@proton/shared/lib/mail/send/attachments';

import ItemColumnLayout from 'proton-mail/components/list/ItemColumnLayout';
import { MAX_COLUMN_ATTACHMENT_THUMBNAILS } from 'proton-mail/constants';
import { filterAttachmentToPreview } from 'proton-mail/helpers/attachment/attachmentThumbnails';
import { arrayToBase64 } from 'proton-mail/helpers/base64';
import { addApiMock } from 'proton-mail/helpers/test/api';
import type { GeneratedKey } from 'proton-mail/helpers/test/helper';
import {
    addApiKeys,
    assertIcon,
    clearAll,
    createAttachment,
    generateKeys,
    getAddressKeyCache,
    getCompleteAddress,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from 'proton-mail/helpers/test/helper';
import { mailTestRender } from 'proton-mail/helpers/test/render';
import type { Conversation } from 'proton-mail/models/conversation';
import { addAttachment } from 'proton-mail/store/attachments/attachmentsActions';
import type { DecryptedAttachment } from 'proton-mail/store/attachments/attachmentsTypes';

jest.mock('@proton/shared/lib/helpers/downloadFile'); // mocking left to individual tests
const mockDownloadFile = downloadFile as jest.MockedFunction<typeof downloadFile>;

const fileContent = `test-content`;

const generateAttachmentsMetadata = (numberOfAttachments: number, extension = 'png', mimeType = 'image/png') => {
    const attachmentsMetadata: AttachmentsMetadata[] = [];

    for (let i = 0; i < numberOfAttachments; i++) {
        const metadata: AttachmentsMetadata = {
            ID: i.toString(),
            Disposition: ATTACHMENT_DISPOSITION.ATTACHMENT,
            MIMEType: mimeType,
            Size: 200000,
            Name: `Attachment-${i}.${extension}`,
        };
        attachmentsMetadata.push(metadata);
    }

    return attachmentsMetadata;
};

const setup = async (
    attachmentsMetadata: AttachmentsMetadata[],
    numAttachments: number,
    { AddressID, fromAddress, fromKeys }: { AddressID: string; fromAddress: string; fromKeys: GeneratedKey }
) => {
    const element = {
        ID: 'conversationID',
        Subject: 'Conversation thumbnails',
        Time: Date.now(),
        Senders: [{ Address: 'sender@proton.me', Name: 'Sender' }],
        Recipients: [{ Address: 'recipient@proton.me', Name: 'Recipient' }],
        Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX }],
        NumAttachments: numAttachments,
        AttachmentsMetadata: attachmentsMetadata,
    } as Conversation;

    const address = getCompleteAddress({ ID: AddressID, Email: fromAddress });
    return mailTestRender(
        <ItemColumnLayout
            labelID={MAILBOX_LABEL_IDS.INBOX}
            element={element}
            conversationMode={true}
            showIcon={true}
            senders={<>Sender</>}
            unread={false}
            onBack={jest.fn()}
            isSelected={false}
            attachmentsMetadata={filterAttachmentToPreview(attachmentsMetadata)}
        />,
        {
            preloadedState: {
                addresses: getModelState([address]),
                addressKeys: getAddressKeyCache(address, [fromKeys]),
            },
        }
    );
};

describe('ItemAttachmentThumbnails', () => {
    const AddressID = 'AddressID';
    const fromAddress = 'me@home.net';

    let fromKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        addApiKeys(false, fromAddress, []);
    });

    beforeEach(async () => {
        clearAll();
        fromKeys = await generateKeys('me', fromAddress);
    });

    afterEach(() => clearAll());

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should not display attachment thumbnails', async () => {
        const elementTotalAttachments = 0;

        // The conversation has no attachments.
        await setup([], elementTotalAttachments, { AddressID, fromKeys, fromAddress });

        // No attachment thumbnail displayed
        expect(screen.queryByText(`Attachment-`)).toBeNull();

        // +X should not be displayed
        expect(screen.queryByTestId('attachment-thumbnail:other-attachment-number')).toBeNull();

        // Paper clip icon is not displayed
        expect(screen.queryByTestId('item-attachment-icon-paper-clip')).toBeNull();
    });

    it('should display attachment thumbnails', async () => {
        const numberOfReceivedMetadata = 5;

        const attachmentsMetadata = generateAttachmentsMetadata(numberOfReceivedMetadata);

        // We received the metadata for 5 attachments, and we can display 2 thumbnails
        await setup(attachmentsMetadata, numberOfReceivedMetadata, { AddressID, fromKeys, fromAddress });

        const items = screen.getAllByTestId('attachment-thumbnail');
        // 2 first attachments are displayed
        for (let i = 0; i < MAX_COLUMN_ATTACHMENT_THUMBNAILS; i++) {
            expect(items[i].textContent).toEqual(`Attachment-${i}.png`);
        }

        // Other received attachments are not displayed since we cannot display them
        for (let i = MAX_COLUMN_ATTACHMENT_THUMBNAILS; i < numberOfReceivedMetadata; i++) {
            // use title because text is split in multiple elements
            expect(screen.queryByTitle(`Attachment-${i}.png`)).toBeNull();
        }

        // Since we have 5 attachment metadata, and we display 2 of them. So we should see +3
        screen.getByText(`+${numberOfReceivedMetadata - MAX_COLUMN_ATTACHMENT_THUMBNAILS}`);

        // Paper clip icon is displayed (in row mode paper clip can be rendered twice because of responsive)
        screen.getAllByTestId('item-attachment-icon-paper-clip');
    });

    it('should not display +X attachment', async () => {
        const numberOfReceivedMetadata = 1;

        const attachmentsMetadata = generateAttachmentsMetadata(numberOfReceivedMetadata);

        // The conversation has 1 attachment in total.
        // We received the metadata for 1 of them, which will display 1 thumbnail
        await setup(attachmentsMetadata, numberOfReceivedMetadata, { AddressID, fromKeys, fromAddress });

        const items = screen.getAllByTestId('attachment-thumbnail');
        // 2 first attachments are displayed
        for (let i = 0; i < numberOfReceivedMetadata; i++) {
            // use title because text is split in multiple elements
            expect(items[i].textContent).toEqual(`Attachment-${i}.png`);
        }

        // No other thumbnail element is displayed
        for (let i = numberOfReceivedMetadata; i < MAX_COLUMN_ATTACHMENT_THUMBNAILS; i++) {
            expect(screen.queryByTitle(`Attachment-${i}.png`)).toBeNull();
        }

        // +X should not be displayed
        expect(screen.queryByTestId('attachment-thumbnail:other-attachment-number')).toBeNull();

        // Paper clip icon is displayed (in row mode paper clip can be rendered twice because of responsive)
        screen.getAllByTestId('item-attachment-icon-paper-clip');
    });

    it('should should display paper clip icon and no thumbnails when no attachment can be previewed', async () => {
        const elementTotalAttachments = 10;

        // The conversation has 10 attachment in total.
        // We received no metadata, so no thumbnail will be displayed
        await setup([], elementTotalAttachments, { AddressID, fromKeys, fromAddress });

        // No attachment thumbnail displayed
        expect(screen.queryByText(`Attachment-`)).toBeNull();

        // +X should not be displayed
        expect(screen.queryByTestId('attachment-thumbnail:other-attachment-number')).toBeNull();

        // Paper clip icons are displayed
        expect(screen.getAllByTestId('item-attachment-icon-paper-clip').length).toBe(2);
    });

    it('should display the expected attachment icon', async () => {
        const numAttachments = 2;
        const attachmentsMetadata: AttachmentsMetadata[] = [
            {
                ID: '0',
                Disposition: ATTACHMENT_DISPOSITION.ATTACHMENT,
                MIMEType: 'image/png',
                Size: 200000,
                Name: `Attachment-0.png`,
            },
            {
                ID: '1',
                Disposition: ATTACHMENT_DISPOSITION.ATTACHMENT,
                MIMEType: 'application/pdf',
                Size: 200000,
                Name: `Attachment-1.pdf`,
            },
        ];

        const icons = ['sm-image', 'sm-pdf'];
        const extensions = ['png', 'pdf'];

        await setup(attachmentsMetadata, numAttachments, { AddressID, fromKeys, fromAddress });

        const items = screen.getAllByTestId('attachment-thumbnail');
        for (let i = 0; i < 2; i++) {
            expect(items[i].textContent).toEqual(`Attachment-${i}.${extensions[i]}`);

            assertIcon(items[i].querySelector('svg'), icons[i], undefined, 'mime');
        }
    });
});

describe('ItemAttachmentThumbnails - Preview', () => {
    const AddressID = 'AddressID';
    const fromAddress = 'me@home.net';

    let fromKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        // Mock feature flag
        // TODO update when we'll have a better solution

        addApiKeys(false, fromAddress, []);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    beforeEach(async () => {
        clearAll();
        fromKeys = await generateKeys('me', fromAddress);
    });

    afterEach(async () => {
        clearAll();
    });

    const mockAttachmentThumbnailsAPICalls = async (
        attachmentsMetadata: AttachmentsMetadata[],
        keys: GeneratedKey,
        decryptShouldFail = false
    ) => {
        addApiMock('core/v4/keys/all', () => ({ Address: { Keys: [] } }));

        return Promise.all(
            attachmentsMetadata.map(async (metadata) => {
                const { ID, Name, MIMEType } = metadata;
                const attachmentID = ID;
                const attachmentName = Name;
                const attachmentType = MIMEType;

                const file = new File([new Blob([fileContent])], attachmentName, { type: attachmentType });

                const attachmentPackets = await encryptAttachment(fileContent, file, false, keys.publicKeys[0], []);
                // Trigger a fail during decrypt (when necessary) to test some scenarios (e.g. decryption failed)
                const attachmentKeyPackets = decryptShouldFail ? new Uint8Array() : attachmentPackets.keys;
                const attachmentSpy = jest.fn(() => attachmentPackets.data);
                const attachmentMetadataSpy = jest.fn(() => ({
                    Attachment: {
                        KeyPackets: arrayToBase64(attachmentKeyPackets),
                        Sender: { Address: fromAddress },
                        AddressID,
                    },
                }));
                addApiMock(`mail/v4/attachments/${attachmentID}`, attachmentSpy);
                addApiMock(`mail/v4/attachments/${attachmentID}/metadata`, attachmentMetadataSpy);

                return {
                    attachmentSpy,
                    attachmentMetadataSpy,
                    attachmentPackets,
                };
            })
        );
    };

    const waitForVisibleAttachmentPreview = async (
        attachmentMetadata: AttachmentsMetadata,
        preview: HTMLElement = screen.getByTestId('file-preview')
    ) => {
        expect(preview.textContent).toMatch(new RegExp(attachmentMetadata.Name));
        // File content is visible
        await waitFor(() => expect(preview.textContent).toMatch(new RegExp(fileContent)));
    };

    it('should preview an attachment that was already in Redux state', async () => {
        window.URL.createObjectURL = jest.fn();
        const numAttachments = 1;

        const attachmentsMetadata = generateAttachmentsMetadata(numAttachments, 'txt', 'text/plain');

        const { attachment } = await createAttachment(
            {
                ID: attachmentsMetadata[0].ID,
                Name: attachmentsMetadata[0].Name,
                MIMEType: attachmentsMetadata[0].MIMEType,
                data: new Uint8Array(),
            },
            fromKeys.publicKeys
        );

        // Mock to check that if attachment is in the state, no api call is done
        const mocks = await mockAttachmentThumbnailsAPICalls(attachmentsMetadata, fromKeys);

        const { store } = await setup(attachmentsMetadata, numAttachments, { AddressID, fromKeys, fromAddress });

        store.dispatch(
            addAttachment({
                ID: attachment.ID as string,
                attachment: {
                    data: attachment.data,
                } as DecryptedAttachment,
            })
        );

        const item = screen.getByTestId('attachment-thumbnail');
        fireEvent.click(item);

        const preview = screen.getByTestId('file-preview');
        await waitFor(() => expect(preview.textContent).toMatch(new RegExp(attachmentsMetadata[0].Name)));

        expect(mocks[0].attachmentSpy).not.toHaveBeenCalled();
        expect(mocks[0].attachmentMetadataSpy).not.toHaveBeenCalled();
    });

    it('should preview an attachment that was not in Redux state', async () => {
        window.URL.createObjectURL = jest.fn();
        const numAttachments = 1;

        const attachmentsMetadata = generateAttachmentsMetadata(numAttachments, 'txt', 'text/plain');

        const mocks = await mockAttachmentThumbnailsAPICalls(attachmentsMetadata, fromKeys);

        await setup(attachmentsMetadata, numAttachments, { AddressID, fromKeys, fromAddress });

        const item = screen.getByTestId('attachment-thumbnail');
        fireEvent.click(item);

        expect(mocks[0].attachmentSpy).toHaveBeenCalled();
        expect(mocks[0].attachmentMetadataSpy).toHaveBeenCalled();

        await waitForVisibleAttachmentPreview(attachmentsMetadata[0]);
    });

    it('should be possible to switch between attachments when Redux state is filled', async () => {
        window.URL.createObjectURL = jest.fn();
        const numAttachments = 2;

        const attachmentsMetadata = generateAttachmentsMetadata(numAttachments, 'txt', 'text/plain');

        const { attachment: attachment1 } = await createAttachment(
            {
                ID: attachmentsMetadata[0].ID,
                Name: attachmentsMetadata[0].Name,
                MIMEType: attachmentsMetadata[0].MIMEType,
                data: new Uint8Array(),
            },
            fromKeys.publicKeys
        );

        const { attachment: attachment2 } = await createAttachment(
            {
                ID: attachmentsMetadata[1].ID,
                Name: attachmentsMetadata[1].Name,
                MIMEType: attachmentsMetadata[1].MIMEType,
                data: new Uint8Array(),
            },
            fromKeys.publicKeys
        );

        const { store } = await setup(attachmentsMetadata, numAttachments, { AddressID, fromKeys, fromAddress });

        store.dispatch(
            addAttachment({
                ID: attachment1.ID as string,
                attachment: {
                    data: attachment1.data,
                } as DecryptedAttachment,
            })
        );

        store.dispatch(
            addAttachment({
                ID: attachment2.ID as string,
                attachment: {
                    data: attachment2.data,
                } as DecryptedAttachment,
            })
        );

        const item = screen.getAllByTestId('attachment-thumbnail');

        // Preview first item
        fireEvent.click(item[0]);

        const preview = screen.getByTestId('file-preview');
        await waitFor(() => expect(preview.textContent).toMatch(new RegExp(attachmentsMetadata[0].Name)));

        // Switch to next item
        const nextButton = screen.getByTestId('file-preview:navigation:next');
        fireEvent.click(nextButton);

        await waitFor(() => expect(preview.textContent).toMatch(new RegExp(attachmentsMetadata[1].Name)));
    });

    it('should show a message instead of preview when attachment decryption failed', async () => {
        window.URL.createObjectURL = jest.fn();
        const numAttachments = 1;

        const attachmentsMetadata = generateAttachmentsMetadata(numAttachments, 'txt', 'text/plain');

        const mocks = await mockAttachmentThumbnailsAPICalls(attachmentsMetadata, fromKeys, true);

        await setup(attachmentsMetadata, numAttachments, { AddressID, fromKeys, fromAddress });

        const item = screen.getByTestId('attachment-thumbnail');
        fireEvent.click(item);

        expect(mocks[0].attachmentSpy).toHaveBeenCalled();
        expect(mocks[0].attachmentMetadataSpy).toHaveBeenCalled();

        const preview = screen.getByTestId('file-preview');
        expect(preview.textContent).toMatch(new RegExp(attachmentsMetadata[0].Name));
        // File preview cannot be displayed because decryption failed
        await waitFor(() =>
            expect(preview.textContent).toMatch(new RegExp('Preview for this file type is not supported'))
        );
    });

    it('should be possible to switch between attachments when not present in Redux state', async () => {
        window.URL.createObjectURL = jest.fn();
        const numAttachments = 2;

        const attachmentsMetadata = generateAttachmentsMetadata(numAttachments, 'txt', 'text/plain');

        const mocks = await mockAttachmentThumbnailsAPICalls(attachmentsMetadata, fromKeys);

        await setup(attachmentsMetadata, numAttachments, { AddressID, fromKeys, fromAddress });

        const item = screen.getAllByTestId('attachment-thumbnail');

        // Preview first item
        fireEvent.click(item[0]);

        expect(mocks[0].attachmentSpy).toHaveBeenCalled();
        expect(mocks[0].attachmentMetadataSpy).toHaveBeenCalled();

        const preview = screen.getByTestId('file-preview');
        await waitForVisibleAttachmentPreview(attachmentsMetadata[0], preview);

        // Switch to next item
        const nextButton = screen.getByTestId('file-preview:navigation:next');
        fireEvent.click(nextButton);

        expect(mocks[1].attachmentSpy).toHaveBeenCalled();
        expect(mocks[1].attachmentMetadataSpy).toHaveBeenCalled();

        await waitForVisibleAttachmentPreview(attachmentsMetadata[1], preview);
    });

    it('should download the attachment', async () => {
        // Promise to ensure we wait until the async onClick callback is executed before carrying out the final checks
        const downloadFileCalled = new Promise<void>((resolve) => {
            mockDownloadFile.mockImplementation(() => resolve());
        });
        window.URL.createObjectURL = jest.fn();
        const numAttachments = 1;
        const attachmentsMetadata = generateAttachmentsMetadata(numAttachments, 'txt', 'text/plain');

        const { attachment } = await createAttachment(
            {
                ID: attachmentsMetadata[0].ID,
                Name: attachmentsMetadata[0].Name,
                MIMEType: attachmentsMetadata[0].MIMEType,
                data: new Uint8Array(),
            },
            fromKeys.publicKeys
        );

        const { store } = await setup(attachmentsMetadata, numAttachments, { AddressID, fromKeys, fromAddress });

        store.dispatch(
            addAttachment({
                ID: attachment.ID as string,
                attachment: {
                    data: attachment.data,
                } as DecryptedAttachment,
            })
        );

        const item = screen.getByTestId('attachment-thumbnail');
        fireEvent.click(item);

        const preview = screen.getByTestId('file-preview');
        await waitFor(() => expect(preview.textContent).toMatch(new RegExp(attachmentsMetadata[0].Name)));

        const downloadButton = screen.getByTestId('file-preview:actions:download');
        fireEvent.click(downloadButton);

        await act(() => downloadFileCalled);

        expect(downloadFile).toHaveBeenCalled();
    });

    it('should download a pgp attachment when decryption failed', async () => {
        // Promise to ensure we wait until the async onClick callback is executed before carrying out the final checks
        const downloadFileCalled = new Promise<void>((resolve) => {
            mockDownloadFile.mockImplementation(() => resolve());
        });

        window.URL.createObjectURL = jest.fn();
        const numAttachments = 1;

        const attachmentsMetadata = generateAttachmentsMetadata(numAttachments, 'txt', 'text/plain');

        const mocks = await mockAttachmentThumbnailsAPICalls(attachmentsMetadata, fromKeys, true);

        await setup(attachmentsMetadata, numAttachments, { AddressID, fromKeys, fromAddress });

        const item = screen.getByTestId('attachment-thumbnail');
        fireEvent.click(item);

        expect(mocks[0].attachmentSpy).toHaveBeenCalled();
        expect(mocks[0].attachmentMetadataSpy).toHaveBeenCalled();

        const preview = screen.getByTestId('file-preview');
        expect(preview.textContent).toMatch(new RegExp(attachmentsMetadata[0].Name));
        // File preview cannot be displayed because decryption failed
        await waitFor(() =>
            expect(preview.textContent).toMatch(new RegExp('Preview for this file type is not supported'))
        );

        // Download the encrypted attachment
        const downloadButton = screen.getByTestId('file-preview:actions:download');
        fireEvent.click(downloadButton);
        await act(() => downloadFileCalled);

        const blob = new Blob([mocks[0].attachmentPackets.data], {
            type: 'application/pgp-encrypted',
        });
        await waitFor(() => expect(downloadFile).toHaveBeenCalledTimes(1));
        expect(downloadFile).toHaveBeenCalledWith(blob, 'Attachment-0.txt.pgp');
    });
});
