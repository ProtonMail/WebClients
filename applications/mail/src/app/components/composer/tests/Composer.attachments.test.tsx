import { act, fireEvent, getByTitle } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/test';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Address, Key } from '@proton/shared/lib/interfaces';

import { arrayToBase64 } from '../../../helpers/base64';
import { getAddressKeyCache, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import type { GeneratedKey } from '../../../helpers/test/helper';
import {
    addApiKeys,
    addApiMock,
    addApiResolver,
    clearAll,
    createAttachment,
    createDocument,
    decryptSessionKey,
    generateKeys,
    getCompleteAddress,
    getDropdown,
    minimalCache,
    parseFormData,
    render,
    tick,
    waitForNoNotification,
    waitForNotification,
    waitForSpyCall,
} from '../../../helpers/test/helper';
import Composer from '../Composer';
import { ID, getMessage, prepareMessage, props, saveNow, toAddress } from './Composer.test.helpers';

loudRejection();

jest.setTimeout(20000);

describe('Composer attachments', () => {
    let address1Keys: GeneratedKey;
    let address2Keys: GeneratedKey;

    const address1 = { ID: 'AddressID1', Email: 'email1@home.net', Keys: [{ ID: 'KeyID1' } as Key] } as Address;
    const address2 = { ID: 'AddressID2', Email: 'email2@home.net', Keys: [{ ID: 'KeyID2' } as Key] } as Address;

    const fileName = 'file.png';
    const fileType = 'image/png';
    const file = new File([], fileName, { type: fileType });
    const attachmentData = { ID: 'AttachmentID', Name: fileName, MIMEType: fileType };

    let updateSpy: jest.Mock;
    let sendSpy: jest.Mock;

    const composerID = 'composer-test-id';

    const setup = async (MIMEType = MIME_TYPES.PLAINTEXT) => {
        const { attachment, sessionKey: generatedSessionKey } = await createAttachment(
            attachmentData,
            address1Keys.publicKeys
        );

        const { resolve } = addApiResolver('mail/v4/attachments');

        updateSpy = jest.fn(({ data: { Message, AttachmentKeyPackets } }: any) => {
            Message.Attachments = Message.Attachments.map((Attachment: any) =>
                AttachmentKeyPackets?.[Attachment.ID]
                    ? { ...Attachment, KeyPackets: AttachmentKeyPackets[Attachment.ID] }
                    : Attachment
            );
            return Promise.resolve({ Message });
        });
        addApiMock(`mail/v4/messages/${ID}`, updateSpy, 'put');

        sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
        addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post');

        minimalCache();

        const message = getMessage({
            localID: ID,
            data: { AddressID: address1.ID, MIMEType, Sender: { Address: address1.Email, Name: address1.ID } },
            messageDocument: { plainText: 'test', document: createDocument('hello') },
        });

        const result = await render(<Composer {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareMessage(store, message, composerID);
            },
            preloadedState: {
                addresses: getModelState([getCompleteAddress(address1), getCompleteAddress(address2)]),
                addressKeys: {
                    ...getAddressKeyCache(address1.ID, address1Keys),
                    ...getAddressKeyCache(address2.ID, address2Keys),
                },
            },
        });

        addApiKeys(false, toAddress, []);

        props.onClose.mockImplementation(result.unmount);

        const inputAttachment = result.getByTestId('composer-attachments-button') as HTMLInputElement;
        fireEvent.change(inputAttachment, { target: { files: [file] } });
        await tick();

        return { ...result, resolve, message, attachment, generatedSessionKey, updateSpy, sendSpy };
    };

    const waitForAutoSave = async () => {
        jest.useFakeTimers();
        act(() => {
            jest.advanceTimersByTime(3000);
        });
        jest.useRealTimers();

        // React 18 got issues with faketimers.
        // Fix is to wait a bit for a proper rerender.
        await wait(100);

        await waitForSpyCall({ spy: updateSpy });
    };

    const switchAddress = async (getByTestId: (id: string) => HTMLElement) => {
        const fromButton = getByTestId('composer:from') as HTMLButtonElement;
        fireEvent.click(fromButton);

        const fromDropdown = await getDropdown();
        const email2Dropdown = getByTitle(fromDropdown, address2.Email);
        fireEvent.click(email2Dropdown);
    };

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
        const { queryAllByText, findByText, resolve, container, attachment } = await setup();

        const embeddedModalMatch = queryAllByText('Insert image');
        expect(embeddedModalMatch.length).toBe(0);

        // Testing aria-label is simple as filename has an ellipse split in the middle
        const attachmentName = container.querySelector(`[aria-label="${fileName}"]`);
        expect(attachmentName).not.toBe(null);

        resolve({ Attachment: attachment });

        await waitForAutoSave();

        // file without an "s" mean only one
        await findByText('file attached');
    });

    it('should show embedded modal when html mode', async () => {
        const { queryAllByText, getByTestId, findByText, resolve, container, attachment } = await setup(
            MIME_TYPES.DEFAULT
        );

        const embeddedModalMatch = queryAllByText('Insert image');
        expect(embeddedModalMatch.length).toBeGreaterThanOrEqual(1);

        const attachmentButton = getByTestId('composer:insert-image-attachment');
        fireEvent.click(attachmentButton);
        await tick();

        // Testing aria-label is simple as filename has an ellipse split in the middle
        const attachmentName = container.querySelector(`[aria-label="${fileName}"]`);
        expect(attachmentName).not.toBe(null);

        resolve({ Attachment: attachment });

        await waitForAutoSave();

        await findByText('file attached');
    });

    it('should re-encrypt attachment key packets on sender address change', async () => {
        const { getByTestId, findByText, resolve, attachment, generatedSessionKey, container, updateSpy } =
            await setup();
        resolve({ Attachment: attachment });

        await waitForAutoSave();

        await switchAddress(getByTestId);

        await findByText('file attached');

        await saveNow(container);

        await waitForSpyCall({ spy: updateSpy, callTimes: 2 });

        const requestData = (updateSpy.mock.calls[1] as any[])[0].data;
        const keyPackets = requestData.AttachmentKeyPackets[attachment.ID as string];

        expect(keyPackets).toBeDefined();

        const decryptedSessionKey = await decryptSessionKey(keyPackets, address2Keys.privateKeys);

        expect(generatedSessionKey).toEqual(decryptedSessionKey);
    });

    it('should re-encrypt attachment key packets on sender address change and send', async () => {
        const { message, resolve, attachment, generatedSessionKey, updateSpy, sendSpy, ...renderResult } =
            await setup();

        await switchAddress(renderResult.getByTestId);

        const sendButton = await renderResult.findByTestId('composer:send-button');
        fireEvent.click(sendButton);

        await waitForNotification('Sending message...');
        resolve({ Attachment: attachment });

        await waitForSpyCall({ spy: updateSpy });
        await waitForSpyCall({ spy: sendSpy });

        await waitForNotification('Message sent');
        await waitForNoNotification();

        const requestData = (updateSpy.mock.calls[0] as any[])[0].data;
        const keyPackets = requestData.AttachmentKeyPackets[attachment.ID as string];

        expect(keyPackets).toBeDefined();

        const sendRequest = (sendSpy.mock.calls[0] as any[])[0].data;
        const sendData = parseFormData(sendRequest);
        const attachmentKey = sendData.Packages['text/plain'].AttachmentKeys[attachment.ID as string].Key;

        // Attachment session key sent is the one we generated
        expect(attachmentKey).toBe(arrayToBase64(generatedSessionKey.data));
    });
});
