import { MIME_TYPES } from '@proton/shared/lib/constants';

import { buildMessageBatchResponse, buildMessageMetadata } from '../testing/messages';
import { type BatchMessageDecryptionFunction, MailApiBridge } from './MailApiBridge';

type ApiConfig = { data?: { MessageIDs: string[] } };

const makeLogger = () => {
    return { trace: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() };
};

const batchApi = (returnedIds?: string[]) => {
    return jest.fn(async ({ data }: ApiConfig) => {
        return {
            Code: 1000,
            Messages: (returnedIds ?? data!.MessageIDs).map((ID) => {
                return buildMessageBatchResponse({ ID, Body: `body of ${ID}` });
            }),
        };
    });
};

const decryptBody: BatchMessageDecryptionFunction = async (message) => {
    if (message.ID === 'undecryptable') {
        throw new Error('bad key');
    }
    return { decryptedBody: `decrypted ${message.Body}`, mimeType: MIME_TYPES.PLAINTEXT };
};

describe('MailApiBridge', () => {
    describe('fetchAndDecryptBodies', () => {
        it('should fetch the bodies in one request and return them decrypted', async () => {
            const api = batchApi();
            const bridge = new MailApiBridge(api as any, decryptBody, makeLogger());

            const bodies = await bridge.fetchAndDecryptBodies(1, [
                buildMessageMetadata({ ID: 'a' }),
                buildMessageMetadata({ ID: 'b' }),
            ]);

            expect(api).toHaveBeenCalledTimes(1);
            expect(api.mock.calls[0][0].data!.MessageIDs).toEqual(['a', 'b']);
            expect(bodies.get('a')?.decryptedBody).toBe('decrypted body of a');
            expect(bodies.get('b')?.decryptedBody).toBe('decrypted body of b');
        });

        it('should not request bodies without an address id', async () => {
            const api = batchApi();
            const logger = makeLogger();
            const bridge = new MailApiBridge(api as any, decryptBody, logger);

            const bodies = await bridge.fetchAndDecryptBodies(1, [
                buildMessageMetadata({ ID: 'a' }),
                buildMessageMetadata({ ID: 'no-address', AddressID: '' }),
            ]);

            expect(api.mock.calls[0][0].data!.MessageIDs).toEqual(['a']);
            expect([...bodies.keys()]).toEqual(['a']);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('no-address'));
        });

        it('should not call the api when no body can be decrypted', async () => {
            const api = batchApi();
            const bridge = new MailApiBridge(api as any, decryptBody, makeLogger());

            const bodies = await bridge.fetchAndDecryptBodies(1, [buildMessageMetadata({ AddressID: '' })]);

            expect(api).not.toHaveBeenCalled();
            expect(bodies.size).toBe(0);
        });

        it('should leave out and log the bodies that fail decryption', async () => {
            const logger = makeLogger();
            const bridge = new MailApiBridge(batchApi() as any, decryptBody, logger);

            const bodies = await bridge.fetchAndDecryptBodies(1, [
                buildMessageMetadata({ ID: 'a' }),
                buildMessageMetadata({ ID: 'undecryptable' }),
            ]);

            expect([...bodies.keys()]).toEqual(['a']);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('undecryptable'));
        });

        it('should reject when aborted during decryption', async () => {
            let bridge: MailApiBridge;
            const abortingDecrypt: BatchMessageDecryptionFunction = async (message) => {
                bridge.abort(1);
                return decryptBody(message, buildMessageMetadata());
            };
            bridge = new MailApiBridge(batchApi() as any, abortingDecrypt, makeLogger());

            await expect(bridge.fetchAndDecryptBodies(1, [buildMessageMetadata({ ID: 'a' })])).rejects.toThrow();
        });

        it('should log the bodies missing from the response', async () => {
            const logger = makeLogger();
            const bridge = new MailApiBridge(batchApi(['a']) as any, decryptBody, logger);

            const bodies = await bridge.fetchAndDecryptBodies(1, [
                buildMessageMetadata({ ID: 'a' }),
                buildMessageMetadata({ ID: 'missing' }),
            ]);

            expect([...bodies.keys()]).toEqual(['a']);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('missing'));
        });
    });
});
