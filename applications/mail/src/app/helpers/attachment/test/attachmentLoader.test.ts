import { encodeBase64 } from '@proton/crypto/lib/utils';
import type { MessageKeys, MessageVerification } from '@proton/mail/store/messages/messagesTypes';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { addApiMock, api } from '../../test/api';
import type { GeneratedKey } from '../../test/crypto';
import {
    fromGeneratedKeysToMessageKeys,
    generateKeys,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../test/crypto';
import { getAndVerifyAttachment, getDecryptedAttachment, getRequest } from '../attachmentLoader';

const me = 'me@pm.me';
const attachmentID = 'attachmentID';
const attachmentName = 'attachmentName';
const attachmentMimeType = 'application/pdf';

const attachment1 = {
    ID: attachmentID,
    Name: attachmentName,
    Preview: stringToUint8Array('message preview'),
    KeyPackets: encodeBase64('keypackets'),
    MIMEType: attachmentMimeType,
} as Attachment;

const outsideMessageKeys = {
    type: 'outside',
    password: 'password',
    id: 'id',
    decryptedToken: 'token',
} as MessageKeys;

// TODO Test decrypt function

describe('getRequest', () => {
    let toKeys: GeneratedKey;
    let messageKeys: MessageKeys;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        toKeys = await generateKeys('me', me);

        messageKeys = fromGeneratedKeysToMessageKeys(toKeys);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should make an api request for a normal attachment', async () => {
        const spy = jest.fn();
        addApiMock(`mail/v4/attachments/${attachmentID}`, spy, 'get');

        await getRequest({ ID: attachmentID }, api, messageKeys);

        expect(spy).toHaveBeenCalled();
    });

    it('should make an api request for a EO attachment', async () => {
        const spy = jest.fn();
        addApiMock(`mail/v4/eo/attachment/${attachmentID}`, spy, 'get');

        await getRequest({ ID: attachmentID }, api, outsideMessageKeys);

        expect(spy).toHaveBeenCalled();
    });
});

describe('getDecryptedAttachment', () => {
    let toKeys: GeneratedKey;
    let messageKeys: MessageKeys;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        toKeys = await generateKeys('me', me);

        messageKeys = fromGeneratedKeysToMessageKeys(toKeys);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    // TODO Need to test case where we get the decrypted attachment, for normal and EO attachments

    it('should throw an error when the attachment is broken', async () => {
        addApiMock(`mail/v4/attachments/${attachmentID}`, jest.fn(), 'get');

        const verificationWithError = {
            verificationErrors: [{ message: 'there is an issue' }],
        } as MessageVerification;

        const result = getDecryptedAttachment(attachment1, verificationWithError, messageKeys, api);

        await expect(result).rejects.toThrow('Attachment decryption error');
    });
});

describe('getAndVerifyAttachment', () => {
    let toKeys: GeneratedKey;
    let messageKeys: MessageKeys;

    const getAttachment = jest.fn();
    const onUpdateAttachment = jest.fn();

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        toKeys = await generateKeys('me', me);

        messageKeys = fromGeneratedKeysToMessageKeys(toKeys);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should return the attachment Preview', async () => {
        const result = await getAndVerifyAttachment(
            attachment1,
            {} as MessageVerification,
            messageKeys,
            api,
            getAttachment,
            onUpdateAttachment
        );

        expect(result.filename).toEqual('preview');
    });

    // TODO need to test case where we can get the attachment, for normal and EO attachments
});
