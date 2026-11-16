import type * as Comlink from 'comlink';

import { MIME_TYPES } from '@proton/shared/lib/constants';

import type { Anchor } from '../../db/schema';
import { buildMessageBatchResponse, buildMessageMetadata } from '../../testing/messages';
import { type BatchMessageDecryptionFunction, MailApiBridge } from '../MailApiBridge';
import type { MessageCacheContent } from '../MessageCache';
import { IndexApi } from './IndexApi';

type ApiConfig = {
    url: string;
    params?: Record<string, unknown>;
    data?: { MessageIDs: string[] };
    signal: AbortSignal;
};

const logger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
};

const decryptBody: BatchMessageDecryptionFunction = async (message) => {
    return { decryptedBody: `decrypted: ${message.ID}`, mimeType: MIME_TYPES.PLAINTEXT };
};

const setup = (api: jest.Mock) => {
    const bridge = new MailApiBridge(api, decryptBody, logger);
    return new IndexApi(bridge as unknown as Comlink.Remote<MailApiBridge>);
};

const batchApi = () => {
    return jest.fn(async ({ data }: ApiConfig) => {
        return {
            Code: 1000,
            Messages: data!.MessageIDs.map((ID) => {
                return buildMessageBatchResponse({ ID });
            }),
        };
    });
};

const ids = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
        return `message-${i}`;
    });
};

const requests = (count: number) => {
    return ids(count).map((ID) => {
        return buildMessageMetadata({ ID });
    });
};

const cachedBody = (ID: string): MessageCacheContent => {
    return { decryptedBody: `cached: ${ID}`, mimeType: MIME_TYPES.PLAINTEXT };
};

describe('IndexApi', () => {
    describe('fetchBodies', () => {
        it('should fetch bodies in batches of 20', async () => {
            const api = batchApi();
            const indexApi = setup(api);

            const bodies = await indexApi.fetchBodies(requests(45), undefined, new AbortController().signal);
            const requestsLength = api.mock.calls.map((call) => {
                return call[0].data?.MessageIDs.length;
            });

            expect(requestsLength).toEqual([20, 20, 5]);
            expect([...bodies.keys()]).toEqual(ids(45));
            expect(bodies.get('message-3')?.decryptedBody).toBe('decrypted: message-3');
        });

        it('should not call the api when there is nothing to fetch', async () => {
            const api = batchApi();
            const indexApi = setup(api);

            const bodies = await indexApi.fetchBodies([], undefined, new AbortController().signal);

            expect(api).not.toHaveBeenCalled();
            expect(bodies.size).toBe(0);
        });

        it('should only request the bodies missing from the cache', async () => {
            const bodyCache = new Map([['message-0', cachedBody('message-0')]]);
            const api = batchApi();
            const indexApi = setup(api);

            const bodies = await indexApi.fetchBodies(requests(3), bodyCache, new AbortController().signal);
            const requested = api.mock.calls.flatMap((call) => {
                return call[0].data!.MessageIDs;
            });

            expect(requested).toEqual(['message-1', 'message-2']);
            expect([...bodies.keys()].sort()).toEqual(ids(3));
            expect(bodies.get('message-0')?.decryptedBody).toBe('cached: message-0');
        });

        it('should write decrypted bodies to the cache', async () => {
            const bodyCache = new Map<string, MessageCacheContent>();
            const indexApi = setup(batchApi());

            await indexApi.fetchBodies(requests(2), bodyCache, new AbortController().signal);

            expect([...bodyCache.keys()]).toEqual(ids(2));
            expect(bodyCache.get('message-1')?.decryptedBody).toBe('decrypted: message-1');
        });

        it('should keep the batches completed before an abort in the cache', async () => {
            const controller = new AbortController();
            const bodyCache = new Map<string, MessageCacheContent>();
            const api = jest.fn(async (config: ApiConfig) => {
                if (api.mock.calls.length > 1) {
                    controller.abort();
                    throw config.signal.reason;
                }
                return batchApi()(config);
            });
            const indexApi = setup(api);

            const error = await indexApi.fetchBodies(requests(25), bodyCache, controller.signal).catch((err) => {
                return err;
            });

            expect(error).toBe(controller.signal.reason);
            expect([...bodyCache.keys()]).toEqual(ids(20));
        });
    });

    describe('fetchMetadataPage', () => {
        it('should mark the anchor as eof and keep its position when the page is empty', async () => {
            const anchor: Anchor = { position: { time: 100, remoteId: 'message-3', processed: 3 } };
            const api = jest.fn().mockResolvedValue({ Messages: [], Total: 0 });
            const indexApi = setup(api);

            const page = await indexApi.fetchMetadataPage(anchor, new AbortController().signal);
            expect(page.messages).toEqual([]);
            expect(page.nextAnchor).toEqual({ position: anchor.position, eof: true });
            expect(page.totalMessages).toBe(3);
        });

        it('should mark an empty mailbox as eof', async () => {
            const api = jest.fn().mockResolvedValue({ Messages: [], Total: 0 });
            const indexApi = setup(api);

            const page = await indexApi.fetchMetadataPage(undefined, new AbortController().signal);
            expect(page.nextAnchor).toEqual({ eof: true });
            expect(page.totalMessages).toBe(0);
        });

        it('should start from the newest message when there is no anchor', async () => {
            const messages = [
                buildMessageMetadata({ ID: 'message-1', Time: 300 }),
                buildMessageMetadata({ ID: 'message-2', Time: 200 }),
            ];
            const api = jest.fn().mockResolvedValue({ Messages: messages, Total: 10 });
            const indexApi = setup(api);

            const page = await indexApi.fetchMetadataPage(undefined, new AbortController().signal);
            expect(page.messages).toEqual(messages);
            expect(page.nextAnchor).toEqual({ position: { time: 200, remoteId: 'message-2', processed: 2 } });
            expect(page.totalMessages).toBe(10);
        });
    });

    describe('abort', () => {
        it('should not call the api when the signal is already aborted', async () => {
            const controller = new AbortController();
            controller.abort();
            const api = batchApi();
            const indexApi = setup(api);

            await expect(indexApi.fetchBodies(requests(1), undefined, controller.signal)).rejects.toBe(
                controller.signal.reason
            );
            expect(api).not.toHaveBeenCalled();
        });
    });
});
