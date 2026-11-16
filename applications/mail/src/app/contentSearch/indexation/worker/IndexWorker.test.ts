// Integration test for IndexWorker: runs the real indexers, wasm engine, blob encryption and
// IndexedDB (fake-indexeddb) against a fake mail api, then checks the result through IndexReader.
import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type * as Comlink from 'comlink';
import 'fake-indexeddb/auto';
import type { IDBPDatabase } from 'idb';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import { openContentSearchDB } from '../../db/open';
import type { Database } from '../../db/schema';
import { IndexReader } from '../../search/IndexReader';
import { buildQuery } from '../../search/query';
import { initContentSearchWasm } from '../../testing/initContentSearchWasm';
import { buildMessageBatchResponse, buildMessageMetadata } from '../../testing/messages';
import { type BatchMessageDecryptionFunction, MailApiBridge } from '../MailApiBridge';
import { IndexWorker, type WorkerIndexListener } from './IndexWorker';

type ApiConfig = {
    method: string;
    url: string;
    params?: { End?: number; EndID?: string; PageSize: number };
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

type StoredMessage = { metadata: MessageMetadata; body: string };

const decryptMessageBody: BatchMessageDecryptionFunction = async (message) => {
    // the fake api serves plaintext bodies
    return {
        decryptedBody: `decrypted: ${message.Body}`,
        decryptedSubject: undefined,
        mimeType: MIME_TYPES.PLAINTEXT,
    };
};

// sorts newest first, ties broken by ID, the order the metadata route returns with Sort=Time, Desc=1
const compareDesc = (a: MessageMetadata, b: MessageMetadata) => b.Time - a.Time || b.ID.localeCompare(a.ID);

/** in-memory mailbox serving the routes IndexApi uses: the metadata listing, the body batch and the latest event */
class FakeMailApi {
    readonly messages = new Map<string, StoredMessage>();
    latestEventID = 'latest-event';
    readonly requests: ApiConfig[] = [];
    private blocked?: { predicate: (config: ApiConfig) => boolean; onArrived: () => void };

    add(...messages: StoredMessage[]) {
        for (const m of messages) {
            this.messages.set(m.metadata.ID, m);
        }
    }

    /** the next request matching the predicate hangs until aborted; resolves once it arrives */
    block(predicate: (config: ApiConfig) => boolean): Promise<void> {
        return new Promise((resolve) => {
            this.blocked = { predicate, onArrived: resolve };
        });
    }

    readonly api = async (config: ApiConfig) => {
        this.requests.push(config);
        if (this.blocked?.predicate(config)) {
            this.blocked.onArrived();
            this.blocked = undefined;
            await new Promise((_, reject) => {
                config.signal.addEventListener('abort', () => reject(config.signal.reason), { once: true });
            });
        }
        if (config.method === 'get' && config.url === 'mail/v4/messages') {
            return this.listMetadata(config.params!);
        }
        if (config.method === 'post' && config.url === 'mail/v4/messages/batch') {
            return this.batch(config.data!.MessageIDs);
        }
        if (config.method === 'get' && config.url === 'core/v4/events/latest') {
            return { Code: 1000, EventID: this.latestEventID };
        }
        throw new Error(`unexpected request ${config.method} ${config.url}`);
    };

    private listMetadata({ End, EndID, PageSize }: NonNullable<ApiConfig['params']>) {
        const all = [...this.messages.values()].map((m) => m.metadata).sort(compareDesc);
        // everything strictly older than the (End, EndID) anchor
        const remaining =
            End === undefined ? all : all.filter((m) => m.Time < End || (m.Time === End && m.ID < EndID!));
        return { Code: 1000, Total: remaining.length, Messages: remaining.slice(0, PageSize) };
    }

    private batch(ids: string[]) {
        return {
            Code: 1000,
            Messages: ids.map((ID) => {
                const { metadata, body } = this.messages.get(ID)!;
                return buildMessageBatchResponse({ Body: body }, metadata);
            }),
        };
    }
}

const makeMessage = (index: number, body = 'lorem ipsum dolor'): StoredMessage => ({
    metadata: buildMessageMetadata({
        ID: `message-${String(index).padStart(3, '0')}`,
        Order: index,
        Time: 1_700_000_000 - index,
    }),
    body,
});

const makeMailbox = (count: number, bodies: Record<number, string> = {}) =>
    Array.from({ length: count }, (_, i) => makeMessage(i, bodies[i]));

const makeListener = () =>
    ({
        reportHistoricProgress: jest.fn(),
        reportIndexComplete: jest.fn(),
        reportTaskStarted: jest.fn(),
        reportTaskCompleted: jest.fn(),
        reportError: jest.fn(),
        log: jest.fn(),
    }) satisfies WorkerIndexListener;

const searchKeyword = async (reader: IndexReader, keyword: string, labelIDs: string[] = []) => {
    const ids: string[] = [];
    const params = {
        labelIDs,
        sort: { sort: 'Time', desc: true },
        filter: {},
        search: { keyword },
        normalizedKeywords: undefined,
    } as unknown as NormalizedSearchParams;
    await reader.search(buildQuery(params), (batch) => ids.push(...batch), new AbortController().signal);
    return ids;
};

describe('IndexWorker', () => {
    let userId: string;
    let indexKey: CryptoKey;
    let fakeApi: FakeMailApi;
    let listener: ReturnType<typeof makeListener>;
    let db: IDBPDatabase<Database> | undefined;
    let userCounter = 0;

    beforeAll(async () => {
        await initContentSearchWasm();
    });

    beforeEach(async () => {
        userId = `index-worker-user-${userCounter++}`;
        indexKey = await generateAndImportKey();
        fakeApi = new FakeMailApi();
        listener = makeListener();
    });

    afterEach(() => {
        db?.close();
        db = undefined;
    });

    const createWorker = () => {
        const bridge = new MailApiBridge(fakeApi.api as any, decryptMessageBody, logger);
        return new IndexWorker(userId, indexKey, bridge as unknown as Comlink.Remote<MailApiBridge>, listener);
    };

    // the worker closes its db when done, so open our own to inspect the result
    const openDB = async () => {
        db = await openContentSearchDB(userId);
        return db;
    };

    const openReader = async () => new IndexReader(await openDB(), indexKey);

    describe('historic indexing', () => {
        it('indexes the whole mailbox across several pages', async () => {
            // 70 messages span two metadata pages (60 + 10), plus the empty page that signals eof
            fakeApi.add(...makeMailbox(70, { 3: 'the zebra crossing', 65: 'a giraffe on the last page' }));
            const worker = createWorker();

            worker.pushStartupAction();
            await worker.start();

            const reader = await openReader();
            expect((await reader.getAllIds()).sort()).toEqual([...fakeApi.messages.keys()].sort());
            expect(await searchKeyword(reader, 'zebra')).toEqual(['message-003']);
            expect(await searchKeyword(reader, 'giraffe')).toEqual(['message-065']);
            expect(await searchKeyword(reader, 'elephant')).toEqual([]);

            expect(await db!.get('anchors', 'historic')).toEqual(
                expect.objectContaining({ eof: true, position: expect.objectContaining({ processed: 70 }) })
            );
            expect(listener.reportHistoricProgress.mock.calls).toEqual([
                [0, 70],
                [60, 70],
                [70, 70],
                [70, 70],
            ]);
            expect(listener.reportTaskStarted.mock.calls).toEqual([['historic']]);
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
        });

        it('does not refetch the mailbox once it reached eof', async () => {
            fakeApi.add(...makeMailbox(5));
            const first = createWorker();
            first.pushStartupAction();
            await first.start();
            const requestCount = fakeApi.requests.length;

            const second = createWorker();
            second.pushStartupAction();
            await second.start();

            expect(fakeApi.requests.length).toBe(requestCount);
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(2);
        });

        it('resumes from the stored anchor after being stopped', async () => {
            fakeApi.add(...makeMailbox(70, { 65: 'a giraffe on the last page' }));
            // let the first page through, hang on the second one
            const secondPageRequested = fakeApi.block((config) => config.params?.EndID !== undefined);
            const first = createWorker();
            first.pushStartupAction();
            const run = first.start();

            await secondPageRequested;
            await first.stop();
            await run;

            // only the first page made it into the index
            const reader = await openReader();
            expect(await reader.getAllIds()).toHaveLength(60);
            expect(await searchKeyword(reader, 'giraffe')).toEqual([]);
            expect(listener.reportIndexComplete).not.toHaveBeenCalled();
            db!.close();
            db = undefined;

            const metadataRequestsBefore = fakeApi.requests.filter((r) => r.method === 'get').length;
            const second = createWorker();
            second.pushStartupAction();
            await second.start();

            // picked up after message 59 instead of starting over
            const resumedRequests = fakeApi.requests.filter((r) => r.method === 'get').slice(metadataRequestsBefore);
            expect(resumedRequests[0].params).toEqual(expect.objectContaining({ EndID: 'message-059' }));

            const resumedReader = await openReader();
            expect(await resumedReader.getAllIds()).toHaveLength(70);
            expect(await searchKeyword(resumedReader, 'giraffe')).toEqual(['message-065']);
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
        });

        it('stores the latest event as cursor when starting from scratch', async () => {
            fakeApi.add(...makeMailbox(5));
            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();

            await openDB();
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'latest-event' });
            // fetched before the first metadata page, so nothing falls between the two
            expect(fakeApi.requests[0].url).toBe('core/v4/events/latest');
        });

        it('stores the latest event as cursor for an empty mailbox', async () => {
            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();

            await openDB();
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'latest-event' });
        });

        it('keeps the cursor of the start position when resuming', async () => {
            fakeApi.add(...makeMailbox(70));
            const secondPageRequested = fakeApi.block((config) => config.params?.EndID !== undefined);
            const first = createWorker();
            first.pushStartupAction();
            const run = first.start();
            await secondPageRequested;
            await first.stop();
            await run;

            fakeApi.latestEventID = 'later-event';
            const second = createWorker();
            second.pushStartupAction();
            await second.start();

            await openDB();
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'latest-event' });
            expect(fakeApi.requests.filter((r) => r.url === 'core/v4/events/latest')).toHaveLength(1);
        });

        it('does not store a cursor when the first page is not written', async () => {
            fakeApi.add(...makeMailbox(5));
            const batchRequested = fakeApi.block((config) => config.url === 'mail/v4/messages/batch');
            const worker = createWorker();
            worker.pushStartupAction();
            const run = worker.start();
            await batchRequested;
            await worker.stop();
            await run;

            await openDB();
            expect(await db!.get('event_cursor', 'event_cursor')).toBeUndefined();
        });
    });

    describe('incremental updates', () => {
        it('applies inserts, metadata-only updates and deletes, and stores the event cursor', async () => {
            fakeApi.add(...makeMailbox(3, { 0: 'original zebra', 1: 'soon deleted', 2: 'keeps its walrus body' }));
            const initial = createWorker();
            initial.pushStartupAction();
            await initial.start();

            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            fakeApi.messages.delete('message-001');
            const relabeled = { ...fakeApi.messages.get('message-002')!.metadata, LabelIDs: ['0', '10'] };
            const worker = createWorker();
            worker.pushIncrementalUpdate({
                eventID: 'event-1',
                items: [
                    { metadata: created.metadata, fetchBodyId: created.metadata.ID },
                    { deleteId: 'message-001' },
                    { metadata: relabeled },
                ],
            });
            await worker.start();

            const reader = await openReader();
            expect((await reader.getAllIds()).sort()).toEqual(['message-000', 'message-002', 'message-010']);
            expect(await searchKeyword(reader, 'giraffe')).toEqual(['message-010']);
            expect(await searchKeyword(reader, 'deleted')).toEqual([]);
            // the metadata-only update must not drop the previously indexed body
            expect(await searchKeyword(reader, 'walrus')).toEqual(['message-002']);
            // and the new label is applied to that same document
            expect(await searchKeyword(reader, 'walrus', ['10'])).toEqual(['message-002']);
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-1' });
            // only the inserted message had its body fetched
            const batchRequests = fakeApi.requests.filter((r) => r.url === 'mail/v4/messages/batch');
            expect(batchRequests.at(-1)!.data!.MessageIDs).toEqual(['message-010']);
        });

        it('runs incremental updates before historic indexing', async () => {
            fakeApi.add(...makeMailbox(5));
            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            const worker = createWorker();

            worker.pushStartupAction();
            worker.pushIncrementalUpdate({
                eventID: 'event-1',
                items: [{ metadata: created.metadata, fetchBodyId: created.metadata.ID }],
            });
            await worker.start();

            expect(listener.reportTaskStarted.mock.calls).toEqual([['incremental'], ['historic']]);
            const reader = await openReader();
            expect(await reader.getAllIds()).toHaveLength(6);
            // the incremental update already set a cursor, historic indexing must not replace it
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-1' });
            expect(fakeApi.requests.some((r) => r.url === 'core/v4/events/latest')).toBe(false);
        });

        it('stops accepting work once it ran to completion', async () => {
            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();

            expect(worker.pushStartupAction()).toBe(false);
            expect(worker.pushIncrementalUpdate({ eventID: 'event-1', items: [] })).toBe(false);
        });
    });
});
