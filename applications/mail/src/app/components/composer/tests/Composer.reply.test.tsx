import { fireEvent } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/test';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';

import type { GeneratedKey } from '../../../helpers/test/crypto';
import {
    addApiKeys,
    generateKeys,
    getAddressKeyCache,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../helpers/test/crypto';
import {
    addApiMock,
    clearAll,
    decryptMessage,
    decryptSessionKey,
    getCompleteAddress,
    minimalCache,
    parseDOMStringToBodyElement,
} from '../../../helpers/test/helper';
import { ID, clickSend, renderComposer, send } from './Composer.test.helpers';

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
    const address = getCompleteAddress({ ID: AddressID, Email: fromAddress });

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        fromKeys = await generateKeys('me', fromAddress);
        toKeys = await generateKeys('someone', toAddress);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(() => {
        clearAll();
        jest.useRealTimers();
    });

    it('send content with blockquote collapsed', async () => {
        minimalCache();
        addApiKeys(true, toAddress, [toKeys]);

        // Will use update only on the wrong path, but it allows to have a "nice failure"
        const updateSpy = jest.fn(() => Promise.reject(new Error('Should not update here')));
        addApiMock(`mail/v4/messages/${ID}`, updateSpy, 'put');
        const view = await renderComposer({
            preloadedState: {
                addressKeys: getAddressKeyCache(address, [fromKeys]),
                mailSettings: getModelState({ DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings),
                addresses: getModelState([address]),
            },
            message: {
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            },
        });

        const sendRequest = await send(view);

        const packages = sendRequest.data.Packages;
        const pack = packages['text/html'];
        const toAddressPackage = pack.Addresses[toAddress];
        const sessionKey = await decryptSessionKey(toAddressPackage.BodyKeyPacket, toKeys.privateKeys);
        const decryptResult = await decryptMessage(pack, toKeys.privateKeys, sessionKey);

        expect(decryptResult.data).toContain(bodyContent);
        expect(decryptResult.data).toContain(blockquoteContent);
    });

    it('send content with blockquote expanded', async () => {
        minimalCache();
        addApiKeys(true, toAddress, [toKeys]);

        const view = await renderComposer({
            preloadedState: {
                addressKeys: getAddressKeyCache(address, [fromKeys]),
                mailSettings: getModelState({ DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings),
                addresses: getModelState([address]),
            },
            message: {
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            },
        });

        const iframe = (await view.findByTestId('rooster-iframe')) as HTMLIFrameElement;
        const button = iframe.contentWindow?.document.getElementById('ellipsis') as HTMLButtonElement;

        fireEvent.click(button);

        // Will use update only on the wrong path, but it allows to have a "nice failure"
        const updateSpy = jest.fn(() => Promise.reject(new Error('Should not update here')));
        addApiMock(`mail/v4/messages/${ID}`, updateSpy, 'put');

        const sendRequest = await clickSend(view);

        const packages = sendRequest.data.Packages;
        const pack = packages['text/html'];
        const toAddressPackage = pack.Addresses[toAddress];
        const sessionKey = await decryptSessionKey(toAddressPackage.BodyKeyPacket, toKeys.privateKeys);
        const decryptResult = await decryptMessage(pack, toKeys.privateKeys, sessionKey);

        expect(decryptResult.data).toContain(bodyContent);
        expect(decryptResult.data).toContain(blockquoteContent);
    });
});
