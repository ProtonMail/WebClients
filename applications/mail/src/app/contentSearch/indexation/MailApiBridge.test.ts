import { EVENT_ACTIONS, MIME_TYPES } from '@proton/shared/lib/constants';

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

    describe('fetchEventUpdate', () => {
        const eventApi = (event: object) => {
            return jest.fn(async () => {
                return { Code: 1000, ...event };
            });
        };

        it('should request the events following the cursor', async () => {
            const api = eventApi({ EventID: 'event-2', More: 0, Refresh: 0 });
            const bridge = new MailApiBridge(api as any, decryptBody, makeLogger());

            await bridge.fetchEventUpdate(1, 'event-1');

            expect(api).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: 'core/v5/events/event-1',
                    params: expect.objectContaining({ CalledFrom: 'EncryptedSearch' }),
                    silence: true,
                })
            );
        });

        it('should map the message events', async () => {
            const metadata = buildMessageMetadata({ ID: 'created' });
            const api = eventApi({
                EventID: 'event-2',
                More: 1,
                Refresh: 0,
                Messages: [
                    { ID: 'created', Action: EVENT_ACTIONS.CREATE, Message: metadata },
                    { ID: 'deleted', Action: EVENT_ACTIONS.DELETE },
                ],
                Conversations: [{ ID: 'conversation', Action: EVENT_ACTIONS.DELETE }],
            });
            const bridge = new MailApiBridge(api as any, decryptBody, makeLogger());

            const response = await bridge.fetchEventUpdate(1, 'event-1');

            expect(response).toEqual({
                eventID: 'event-2',
                more: true,
                refresh: false,
                items: [
                    { metadata: expect.objectContaining({ ID: 'created' }), fetchBodyId: 'created' },
                    { deleteId: 'deleted' },
                ],
            });
        });

        it('should return no items when no message changed', async () => {
            const bridge = new MailApiBridge(
                eventApi({ EventID: 'event-1', More: 0, Refresh: 0 }) as any,
                decryptBody,
                makeLogger()
            );

            const response = await bridge.fetchEventUpdate(1, 'event-1');

            expect(response).toEqual({ eventID: 'event-1', more: false, refresh: false, items: [] });
        });

        it('should report a refresh', async () => {
            const bridge = new MailApiBridge(
                eventApi({ EventID: 'event-9', More: 0, Refresh: 255 }) as any,
                decryptBody,
                makeLogger()
            );

            const response = await bridge.fetchEventUpdate(1, 'event-1');

            expect(response).toEqual({ eventID: 'event-9', more: false, refresh: true, items: [] });
        });

        it('should throw when the response has no event id', async () => {
            const bridge = new MailApiBridge(eventApi({ More: 0 }) as any, decryptBody, makeLogger());

            await expect(bridge.fetchEventUpdate(1, 'event-1')).rejects.toThrow();
        });
    });
});
