import { fireEvent } from '@testing-library/dom';
import { act } from '@testing-library/react';
import loudRejection from 'loud-rejection';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { addApiKeys, addKeysToAddressKeysCache, GeneratedKey, generateKeys } from '../../../helpers/test/crypto';
import {
    addToCache,
    decryptMessageLegacy,
    minimalCache,
    decryptSessionKey,
    createDocument,
    clearAll,
    addApiMock,
} from '../../../helpers/test/helper';
import { ID, prepareMessage, send, renderComposer, clickSend } from './Composer.test.helpers';

loudRejection();

jest.setTimeout(20000);

const bodyContent = 'body content';
const blockquoteContent = 'blockquoteContent';
const content = `
    ${bodyContent}

    <blockquote class="protonmail_quote" type="cite">
        ${blockquoteContent}
    </blockquote>
`;

describe('Composer reply and forward', () => {
    const AddressID = 'AddressID';
    const fromAddress = 'me@home.net';
    const toAddress = 'someone@somewhere.net';

    let fromKeys: GeneratedKey;
    let toKeys: GeneratedKey;

    beforeAll(async () => {
        fromKeys = await generateKeys('me', fromAddress);
        toKeys = await generateKeys('someone', toAddress);
    });

    beforeEach(() => {
        addKeysToAddressKeysCache(AddressID, fromKeys);
    });

    afterEach(() => {
        clearAll();
        jest.useRealTimers();
    });

    it('send content with blockquote collapsed', async () => {
        const message = prepareMessage({
            document: createDocument(content),
            data: { MIMEType: MIME_TYPES.DEFAULT },
        });

        minimalCache();
        addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
        addApiKeys(true, toAddress, [toKeys]);

        // Will use update only on the wrong path, but it allows to have a "nice failure"
        const updateSpy = jest.fn(() => Promise.reject(new Error('Should not update here')));
        addApiMock(`mail/v4/messages/${ID}`, updateSpy, 'put');

        const sendRequest = await send(message, false);

        const packages = sendRequest.data.Packages;
        const pack = packages['text/html'];
        const address = pack.Addresses[toAddress];
        const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);
        const decryptResult = await decryptMessageLegacy(pack, toKeys.privateKeys, sessionKey);

        expect(decryptResult.data).toContain(bodyContent);
        expect(decryptResult.data).toContain(blockquoteContent);
    });

    it('send content with blockquote expanded', async () => {
        const message = prepareMessage({
            document: createDocument(content),
            data: { MIMEType: MIME_TYPES.DEFAULT },
        });

        minimalCache();
        addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
        addApiKeys(true, toAddress, [toKeys]);

        const renderResult = await renderComposer(message.localID, false);

        const iframe = (await renderResult.findByTestId('squire-iframe')) as HTMLIFrameElement;
        const button = iframe.contentWindow?.document.getElementById('ellipsis') as HTMLButtonElement;

        await act(async () => {
            fireEvent.click(button);
        });

        // Will use update only on the wrong path, but it allows to have a "nice failure"
        const updateSpy = jest.fn(() => Promise.reject(new Error('Should not update here')));
        addApiMock(`mail/v4/messages/${ID}`, updateSpy, 'put');

        const sendRequest = await clickSend(renderResult);

        const packages = sendRequest.data.Packages;
        const pack = packages['text/html'];
        const address = pack.Addresses[toAddress];
        const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);
        const decryptResult = await decryptMessageLegacy(pack, toKeys.privateKeys, sessionKey);

        expect(decryptResult.data).toContain(bodyContent);
        expect(decryptResult.data).toContain(blockquoteContent);
    });
});
