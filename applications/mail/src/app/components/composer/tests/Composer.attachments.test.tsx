import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/test';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { AddressKey } from '@proton/shared/lib/interfaces';
import type { AttachmentFullMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import { arrayToBase64 } from '../../../helpers/base64';
import { getAddressKeyCache, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import type { GeneratedKey } from '../../../helpers/test/helper';
import {
    addApiKeys,
    addApiMock,
    addApiResolver,
    clearAll,
    createAttachment,
    decryptSessionKey,
    generateKeys,
    getCompleteAddress,
    getDropdown,
    mailTestRender,
    minimalCache,
    parseDOMStringToBodyElement,
    parseFormData,
    tick,
    waitForNoNotification,
    waitForNotification,
    waitForSpyCall,
} from '../../../helpers/test/helper';
import Composer from '../Composer';
import { ID, getMessage, prepareMessage, props, saveNow, toAddress } from './Composer.test.helpers';

loudRejection();

let address1Keys: GeneratedKey;
let address2Keys: GeneratedKey;

const address1 = getCompleteAddress({
    ID: 'AddressID1',
    Email: 'email1@home.net',
    Keys: [{ ID: 'KeyID1', Primary: 1 } as AddressKey],
});
const address2 = getCompleteAddress({
    ID: 'AddressID2',
    Email: 'email2@home.net',
    Keys: [{ ID: 'KeyID2', Primary: 1 } as AddressKey],
});

const fileName = 'file.png';
const fileType = 'image/png';
const file = new File([], fileName, { type: fileType });
const attachmentData = { ID: 'AttachmentID', Name: fileName, MIMEType: fileType };

const composerID = 'composer-test-id';
const conversationID = 'conversation-test-id';

const setup = async (MIMEType = MIME_TYPES.PLAINTEXT) => {
    const { attachment, sessionKey: generatedSessionKey } = await createAttachment(
        attachmentData,
        address1Keys.publicKeys
    );

    const { resolve } = addApiResolver('mail/v4/attachments');

    const updateSpy = jest.fn(({ data: { Message, AttachmentKeyPackets } }) => {
        Message.Attachments = Message.Attachments.map((Attachment: AttachmentFullMetadata) =>
            AttachmentKeyPackets?.[Attachment.ID]
                ? { ...Attachment, KeyPackets: AttachmentKeyPackets[Attachment.ID] }
                : Attachment
        );
        return Promise.resolve({ Message });
    });
    addApiMock(`mail/v4/messages/${ID}`, updateSpy, 'put');

    const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
    addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post');

    minimalCache();

    const message = getMessage({
        localID: ID,
        data: {
            AddressID: address1.ID,
            ConversationID: conversationID,
            MIMEType,
            Sender: { Address: address1.Email, Name: address1.ID },
        },
        messageDocument: { plainText: 'test', document: parseDOMStringToBodyElement('hello') },
    });

    const { container, unmount } = await mailTestRender(<Composer {...props} composerID={composerID} />, {
        onStore: (store) => {
            prepareMessage(store, message, composerID);
        },
        preloadedState: {
            addresses: getModelState([address1, address2]),
            addressKeys: {
                ...getAddressKeyCache(address1, [address1Keys]),
                ...getAddressKeyCache(address2, [address2Keys]),
            },
        },
    });

    addApiKeys(false, toAddress, []);

    props.onClose.mockImplementation(unmount);

    const inputAttachment = screen.getByTestId('composer-attachments-button');
    await userEvent.upload(inputAttachment, file);
    await tick();

    const resolveAttachment = () => resolve({ Attachment: attachment });
    const attachmentId = attachment.ID as string;

    return { attachmentId, container, generatedSessionKey, resolveAttachment, sendSpy, updateSpy };
};

const waitForAutoSave = async (spy: jest.Mock) => {
    await waitForSpyCall({ spy });
};

const switchAddress = async () => {
    const fromButton = screen.getByTestId('composer:from');
    await userEvent.click(fromButton);

    const fromDropdown = await getDropdown();
    const email2Dropdown = within(fromDropdown).getByTitle(address2.Email);
    await userEvent.click(email2Dropdown);
};

interface VerifyAttachmentProps {
    resolveAttachment: () => void;
    updateSpy: jest.Mock;
}

const verifyAttachment = async ({ resolveAttachment, updateSpy }: VerifyAttachmentProps) => {
    const attachmentName = await screen.findByRole('button', { name: `Preview ${fileName}` });
    expect(attachmentName).not.toBe(null);

    resolveAttachment();

    await waitForAutoSave(updateSpy);

    expect(screen.getByTitle('Show attachment details')).toHaveTextContent('1 file attached');
};

describe('Composer attachments', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        address1Keys = await generateKeys('1', address1.Email);
        address2Keys = await generateKeys('2', address2.Email);
    });

    afterAll(async () => {
        clearAll();
        await releaseCryptoProxy();
    });

    beforeEach(() => {
        clearAll();
    });

    it('should not show embedded modal when plaintext mode', async () => {
        const setupProps = await setup();

        const embeddedModalMatch = screen.queryAllByText('Insert image');
        expect(embeddedModalMatch.length).toBe(0);

        await verifyAttachment(setupProps);
    });

    it('should show embedded modal when html mode', async () => {
        const setupProps = await setup(MIME_TYPES.DEFAULT);

        const embeddedModalMatch = screen.getAllByText('Insert image');
        expect(embeddedModalMatch.length).toBeGreaterThanOrEqual(1);

        const attachmentButton = screen.getByTestId('composer:insert-image-attachment');
        await userEvent.click(attachmentButton);
        await tick();

        await verifyAttachment(setupProps);
    });

    it('should re-encrypt attachment key packets on sender address change', async () => {
        const { attachmentId, container, generatedSessionKey, resolveAttachment, updateSpy } = await setup();

        resolveAttachment();

        await waitForAutoSave(updateSpy);

        await switchAddress();

        await waitFor(() => {
            expect(screen.getByTitle('Show attachment details')).toHaveTextContent('1 file attached');
        });

        await saveNow(container);

        await waitForSpyCall({ spy: updateSpy, callTimes: 2 });

        const requestData = (updateSpy.mock.calls[1] as any[])[0].data;
        const keyPackets = requestData.AttachmentKeyPackets[attachmentId];

        expect(keyPackets).toBeDefined();

        const decryptedSessionKey = await decryptSessionKey(keyPackets, address2Keys.privateKeys);

        expect(generatedSessionKey).toEqual(decryptedSessionKey);
    });

    it('should re-encrypt attachment key packets on sender address change and send', async () => {
        const { attachmentId, generatedSessionKey, resolveAttachment, sendSpy, updateSpy } = await setup();

        await switchAddress();

        const sendButton = await screen.findByTestId('composer:send-button');
        await userEvent.click(sendButton);

        await waitForNotification('Sending message...');
        resolveAttachment();

        await waitForSpyCall({ spy: updateSpy });
        await waitForSpyCall({ spy: sendSpy });

        await waitForNotification('Message sent');
        await waitForNoNotification();

        const requestData = (updateSpy.mock.calls[0] as any[])[0].data;
        const keyPackets = requestData.AttachmentKeyPackets[attachmentId];

        expect(keyPackets).toBeDefined();

        const sendRequest = (sendSpy.mock.calls[0] as any[])[0].data;
        const sendData = parseFormData(sendRequest);
        const attachmentKey = sendData.Packages['text/plain'].AttachmentKeys[attachmentId].Key;

        // Attachment session key sent is the one we generated
        expect(attachmentKey).toBe(arrayToBase64(generatedSessionKey.data));
    });
});
