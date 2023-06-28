import { fireEvent, within } from '@testing-library/react';

import { MIME_TYPES } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { assertIcon } from '../../../helpers/test/assertion';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import {
    GeneratedKey,
    addApiKeys,
    addApiMock,
    clearAll,
    createEmbeddedImage,
    createMessageImages,
    encryptMessage,
    generateKeys,
    tick,
} from '../../../helpers/test/helper';
import { store } from '../../../logic/store';
import { addressID, body, initMessage, messageID, setup, subject } from './Message.test.helpers';

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
};

describe('Message attachments', () => {
    const Attachments = [attachment1, attachment2, attachment3];
    const NumAttachments = Attachments.length;
    const icons = ['md-unknown', 'md-pdf', 'md-image'];
    const totalSize = Attachments.map((attachment) => attachment.Size).reduce((acc, size) => acc + size, 0);
    const embeddedImage = createEmbeddedImage(attachment1);
    const messageImages = createMessageImages([embeddedImage]);

    afterEach(clearAll);

    it('should show attachments with their correct icon', async () => {
        initMessage({ data: { NumAttachments, Attachments } });

        const { getAllByTestId } = await setup();

        const items = getAllByTestId('attachment-item');

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
        initMessage({ data: { NumAttachments, Attachments }, messageImages });

        const { getByTestId } = await setup();

        const header = getByTestId('attachment-list:header');

        expect(header.textContent).toMatch(String(totalSize));
        expect(header.textContent).toMatch(/2\s*files/);
        expect(header.textContent).toMatch(/1\s*embedded/);
    });

    it('should open preview when clicking', async () => {
        window.URL.createObjectURL = jest.fn();

        initMessage({ data: { NumAttachments, Attachments } });

        const { getAllByTestId } = await setup();

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

        const { open } = await setup({ conversationMode: true });
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

        const { open } = await setup({ conversationMode: true });
        await open();

        const messageFromCache = store.getState().messages[messageID];

        expect(messageFromCache?.data?.NumAttachments).not.toEqual(receivedNumAttachment);
        expect(messageFromCache?.data?.NumAttachments).toEqual(expectedNumAttachments);
    });
});
