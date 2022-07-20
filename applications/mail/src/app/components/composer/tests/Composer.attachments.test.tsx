import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Address, Key } from '@proton/shared/lib/interfaces';
import { fireEvent, getByTitle, waitFor } from '@testing-library/dom';
import loudRejection from 'loud-rejection';
import { act } from '@testing-library/react';
import {
    clearAll,
    render,
    tick,
    GeneratedKey,
    generateKeys,
    addKeysToAddressKeysCache,
    addApiResolver,
    addApiMock,
    addApiKeys,
    getDropdown,
    addAddressToCache,
    minimalCache,
    createAttachment,
    decryptSessionKey,
    waitForNotification,
    parseFormData,
    waitForNoNotification,
} from '../../../helpers/test/helper';
import { setupCryptoProxyForTesting, releaseCryptoProxy } from '../../../helpers/test/crypto';
import Composer from '../Composer';
import { ID, props, prepareMessage, toAddress } from './Composer.test.helpers';
import { arrayToBase64 } from '../../../helpers/base64';

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

    const setup = async (MIMEType = MIME_TYPES.PLAINTEXT) => {
        const { attachment, sessionKey: generatedSessionKey } = await createAttachment(
            attachmentData,
            address1Keys.publicKeys
        );

        const resolve = addApiResolver('mail/v4/attachments');

        updateSpy = jest.fn(({ data: { Message, AttachmentKeyPackets } }: any) => {
            Message.Attachments.forEach((Attachment: any) => {
                if (AttachmentKeyPackets?.[Attachment.ID]) {
                    Attachment.KeyPackets = AttachmentKeyPackets[Attachment.ID];
                }
            });
            return Promise.resolve({ Message });
        });
        addApiMock(`mail/v4/messages/${ID}`, updateSpy, 'put');

        sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
        addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post');

        minimalCache();

        const message = prepareMessage({
            localID: ID,
            data: { AddressID: address1.ID, MIMEType },
            messageDocument: { plainText: 'test' },
        });

        addApiKeys(false, toAddress, []);
        addAddressToCache(address1);
        addAddressToCache(address2);

        const result = await render(<Composer {...props} messageID={ID} />, false);

        props.onClose.mockImplementation(result.unmount);

        const inputAttachment = result.getByTestId('composer-attachments-button') as HTMLInputElement;
        fireEvent.change(inputAttachment, { target: { files: [file] } });
        await tick();

        return { ...result, resolve, message, attachment, generatedSessionKey, updateSpy, sendSpy };
    };

    const saveNow = async (container: HTMLElement) => {
        fireEvent.keyDown(container, { key: 's', ctrlKey: true });
        await tick();
    };

    const waitForAutoSave = async () => {
        act(() => {
            jest.advanceTimersByTime(3000);
        });
        await tick();
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
        await releaseCryptoProxy();
    });

    beforeEach(() => {
        jest.useFakeTimers();
        addKeysToAddressKeysCache(address1.ID, address1Keys);
        addKeysToAddressKeysCache(address2.ID, address2Keys);
    });

    afterEach(() => {
        clearAll();
        jest.useRealTimers();
    });

    it('should not show embedded modal when plaintext mode', async () => {
        const { queryAllByText, findByText, resolve, container } = await setup();

        const embeddedModalMatch = queryAllByText('Insert image');
        expect(embeddedModalMatch.length).toBe(0);

        // Testing aria-label is simple as filename has an ellipse split in the middle
        const attachmentName = container.querySelector(`[aria-label="${fileName}"]`);
        expect(attachmentName).not.toBe(null);

        resolve({ Attachment: { ID: 'AttachmentID' } });
        await tick();

        await waitForAutoSave();

        // file without an "s" mean only one
        await findByText('file attached');
    });

    it('should show embedded modal when html mode', async () => {
        const { queryAllByText, getByTestId, findByText, resolve, container } = await setup(MIME_TYPES.DEFAULT);

        const embeddedModalMatch = queryAllByText('Insert image');
        expect(embeddedModalMatch.length).toBeGreaterThanOrEqual(1);

        const attachmentButton = getByTestId('composer:insert-image-attachment');
        fireEvent.click(attachmentButton);
        await tick();

        // Testing aria-label is simple as filename has an ellipse split in the middle
        const attachmentName = container.querySelector(`[aria-label="${fileName}"]`);
        expect(attachmentName).not.toBe(null);

        resolve({ Attachment: { ID: 'AttachmentID' } });
        await tick();

        await waitForAutoSave();

        // file without an "s" mean only one
        await findByText('file attached');
    });

    it('should re-encrypt attachment key packets on sender address change', async () => {
        const { getByTestId, findByText, resolve, attachment, generatedSessionKey, container, updateSpy } =
            await setup();

        resolve({ Attachment: attachment });
        await tick();

        await waitForAutoSave();

        await switchAddress(getByTestId);

        await findByText('file attached');

        await saveNow(container);

        expect(updateSpy).toHaveBeenCalled();

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
        await tick();

        await waitForNotification('Sending message...');

        resolve({ Attachment: attachment });
        await tick();

        await waitFor(
            () => {
                expect(updateSpy).toBeCalled();
            },
            { timeout: 20000 }
        );

        await tick();

        await waitFor(
            () => {
                expect(sendSpy).toBeCalled();
            },
            { timeout: 20000 }
        );

        await waitForNotification('Message sent');

        await waitForNoNotification();

        const requestData = (updateSpy.mock.calls[1] as any[])[0].data;
        const keyPackets = requestData.AttachmentKeyPackets[attachment.ID as string];

        expect(keyPackets).toBeDefined();

        const sendRequest = (sendSpy.mock.calls[0] as any[])[0].data;
        const sendData = parseFormData(sendRequest);
        const attachmentKey = sendData.Packages['text/plain'].AttachmentKeys[attachment.ID as string].Key;

        // Attachment session key sent is the one we generated
        expect(attachmentKey).toBe(arrayToBase64(generatedSessionKey.data));
    });
});
