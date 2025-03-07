import { fireEvent, waitFor, within } from '@testing-library/react';

import { MIME_TYPES } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { assertIcon } from '../../../helpers/test/assertion';
import { getAddressKeyCache, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import type { GeneratedKey } from '../../../helpers/test/helper';
import {
    addApiKeys,
    addApiMock,
    clearAll,
    createEmbeddedImage,
    createMessageImages,
    encryptMessage,
    generateKeys,
    getCompleteAddress,
} from '../../../helpers/test/helper';
import { addressID, body, messageID, setup, subject } from './Message.test.helpers';

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
        verificationStatus: MAIL_VERIFICATION_STATUS.NOT_SIGNED,
    },
    nameSplitStart: 'attachment-name-p',
    nameSplitEnd: 'ng.png',
};

describe('Message attachments', () => {
    const Attachments = [attachment1, attachment2, attachment3];
    const NumAttachments = Attachments.length;
    const icons = ['md-unknown', 'md-pdf', 'md-image'];
    const totalSize = Attachments.map((attachment) => attachment.Size).reduce((acc, size) => acc + size, 0);
    const embeddedImage = createEmbeddedImage(attachment1);
    const messageImages = createMessageImages([embeddedImage]);
    const fromAddress = 'someone@somewhere.net';

    let fromKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        fromKeys = await generateKeys('someone', fromAddress);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
        clearAll();
    });

    it('should show attachments with their correct icon', async () => {
        const { getAllByTestId } = await setup({ data: { NumAttachments, Attachments } });

        const items = getAllByTestId('attachment-item');

        expect(items.length).toBe(NumAttachments);
        for (let i = 0; i < NumAttachments; i++) {
            const { getByText, getByTestId } = within(items[i]);
            getByText(Attachments[i].nameSplitStart);
            getByText(Attachments[i].nameSplitEnd);

            const attachmentSizeText = getByTestId('attachment-item:size').textContent;
            expect(attachmentSizeText).toEqual(humanSize({ bytes: Attachments[i].Size }));

            assertIcon(items[i].querySelector('svg'), icons[i], undefined, 'mime');
        }
    });

    it('should show global size and counters', async () => {
        const { getByTestId } = await setup({ data: { NumAttachments, Attachments }, messageImages });

        const header = getByTestId('attachment-list:header');

        expect(header.textContent).toMatch(String(totalSize));
        expect(header.textContent).toMatch(/2\s*files/);
        expect(header.textContent).toMatch(/1\s*embedded/);
    });

    it('should open preview when clicking', async () => {
        window.URL.createObjectURL = jest.fn();

        const { getAllByTestId, getByTestId } = await setup({ data: { NumAttachments, Attachments } }, undefined, {
            preloadedState: {
                addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [fromKeys]),
            },
        });

        const items = getAllByTestId('attachment-item');
        const itemButton = items[2].querySelectorAll('button')[1];

        fireEvent.click(itemButton);

        const preview = getByTestId('file-preview');
        expect(preview).toBeDefined();
        expect(preview?.textContent).toMatch(new RegExp(attachment3.Name));
        expect(preview?.textContent).toMatch(/3of3/);

        // wait for preview to finish loading to ensure there's no pending operations using the CryptoProxy
        await waitFor(() => expect(preview.querySelector('.file-preview-image')).toBeVisible());
    });
});

describe('NumAttachments from message initialization', () => {
    const toAddress = 'me@home.net';
    const fromName = 'someone';
    const fromAddress = 'someone@somewhere.net';

    let toKeys: GeneratedKey;
    let fromKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        toKeys = await generateKeys('me', toAddress);
        fromKeys = await generateKeys('someone', fromAddress);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should have the correct NumAttachments', async () => {
        const receivedNumAttachment = 1;

        addApiKeys(false, fromAddress, []);

        const encryptedBody = await encryptMessage(body, fromKeys, toKeys);

        addApiMock(`mail/v4/messages/${messageID}`, () => ({
            Message: {
                ID: messageID,
                AddressID: addressID,
                Subject: subject,
                Sender: { Name: fromName, Address: fromAddress },
                Body: encryptedBody,
                MIMEType: MIME_TYPES.DEFAULT,
                Attachments: [attachment1] as Attachment[],
                NumAttachments: receivedNumAttachment,
            } as Message,
        }));

        const { store, open } = await setup(
            undefined,
            { conversationMode: true },
            {
                preloadedState: {
                    addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [fromKeys]),
                },
            }
        );
        await open();

        const messageFromCache = store.getState().messages[messageID];

        expect(messageFromCache?.data?.NumAttachments).toEqual(receivedNumAttachment);
    });

    it('should update NumAttachments', async () => {
        const receivedNumAttachment = 0;
        const expectedNumAttachments = 1;

        addApiKeys(false, fromAddress, []);

        const encryptedBody = await encryptMessage(body, fromKeys, toKeys);

        addApiMock(`mail/v4/messages/${messageID}`, () => ({
            Message: {
                ID: messageID,
                AddressID: addressID,
                Subject: subject,
                Sender: { Name: fromName, Address: fromAddress },
                Body: encryptedBody,
                MIMEType: MIME_TYPES.DEFAULT,
                Attachments: [attachment1] as Attachment[],
                NumAttachments: receivedNumAttachment,
            } as Message,
        }));

        const { store, open } = await setup(
            undefined,
            { conversationMode: true },
            {
                preloadedState: {
                    addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [fromKeys]),
                },
            }
        );
        await open();

        const messageFromCache = store.getState().messages[messageID];

        expect(messageFromCache?.data?.NumAttachments).not.toEqual(receivedNumAttachment);
        expect(messageFromCache?.data?.NumAttachments).toEqual(expectedNumAttachments);
    });
});
