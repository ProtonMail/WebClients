import { CryptoProxy } from '@protontech/crypto';

import { MIME_TYPES } from '@proton/shared/lib/constants';

import { addApiMock, api } from '../../helpers/tests/api';
import type { GeneratedKey } from '../../helpers/tests/crypto';
import {
    fromGeneratedKeysToMessageKeys,
    generateKeys,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../helpers/tests/crypto';
import { buildMessageBatchResponse, buildMessageMetadata } from '../testing/messages';
import { MailApiBridge } from './MailApiBridge';
import { createBatchBodyDecryptor } from './batchBodyDecryptor';

describe('batch body decryption through the api bridge', () => {
    let addressKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        addressKeys = await generateKeys('Tester', 'tester@proton.me');
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    const fetchDecryptedBody = async (textData: string, MIMEType = MIME_TYPES.DEFAULT) => {
        const { message } = await CryptoProxy.encryptMessage({
            textData,
            encryptionKeys: addressKeys.publicKeys,
            format: 'binary',
        });
        addApiMock(
            'mail/v4/messages/batch',
            () => {
                return {
                    Code: 1000,
                    Messages: [buildMessageBatchResponse({ ID: 'a', Body: message.toBase64(), MIMEType })],
                };
            },
            'post'
        );
        const getMessageKeys = vi.fn(async () => {
            return fromGeneratedKeysToMessageKeys(addressKeys);
        });
        const logger = {
            trace: vi.fn(),
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            log: vi.fn(),
        };
        const bridge = new MailApiBridge(api, createBatchBodyDecryptor(getMessageKeys), logger);
        const bodies = await bridge.fetchAndDecryptBodies(1, [buildMessageMetadata({ ID: 'a' })]);
        return { body: bodies.get('a'), getMessageKeys };
    };

    it('decrypts base64 bodies from the batch route with the keys of the message address', async () => {
        const { body, getMessageKeys } = await fetchDecryptedBody('hello from a');

        expect(getMessageKeys).toHaveBeenCalledWith(expect.objectContaining({ AddressID: 'address-1' }));
        expect(body?.decryptedBody).toBe('hello from a');
    });

    it('decrypts MIME bodies', async () => {
        const mime = [
            'Content-Type: multipart/mixed; boundary="b"',
            '',
            '--b',
            'Content-Type: text/plain; charset=utf-8',
            '',
            'hello from mime',
            '--b--',
            '',
        ].join('\r\n');

        const { body } = await fetchDecryptedBody(mime, MIME_TYPES.MIME);

        expect(body?.decryptedBody).toContain('hello from mime');
        expect(body?.mimeType).toBe(MIME_TYPES.PLAINTEXT);
    });
});
