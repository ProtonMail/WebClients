// Integration test for IndexWorker: runs the real indexers, wasm engine, blob encryption and
// IndexedDB (fake-indexeddb) against a fake mail api, then checks the result through IndexReader.
import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type * as Comlink from 'comlink';
import 'fake-indexeddb/auto';
import type { IDBPDatabase } from 'idb';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';
import type { Engine } from '@proton/proton-foundation-search';
import { EVENT_ACTIONS, MIME_TYPES } from '@proton/shared/lib/constants';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import { openContentSearchDB } from '../../db/open';
import type { Database } from '../../db/schema';
import { createMailSearchEngine } from '../../engine/create';
import { IndexReader } from '../../search/IndexReader';
import { buildQuery } from '../../search/query';
import { initContentSearchWasm } from '../../testing/initContentSearchWasm';
import { buildMessageBatchResponse, buildMessageMetadata } from '../../testing/messages';
import { ExponentialBackoff } from '../../utils/ExponentialBackoff';
import { type BatchMessageDecryptionFunction, MailApiBridge } from '../MailApiBridge';
import { BlobTxnProvider } from './BlobTxnProvider';
import { IndexWorker, type WorkerIndexListener } from './IndexWorker';

vi.mock('../../engine/create', async (importOriginal) => {
    const actual = await importOriginal<{ createMailSearchEngine: typeof createMailSearchEngine }>();
    return { createMailSearchEngine: vi.fn(actual.createMailSearchEngine) };
});

type ApiConfig = {
    method: string;
    url: string;
    params?: { End?: number; EndID?: string; PageSize: number };
    data?: { MessageIDs: string[] };
    signal: AbortSignal;
};

const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
};

type StoredMessage = { metadata: MessageMetadata; body: string };
type FakeMessageEvent = { ID: string; Action: EVENT_ACTIONS; Message?: MessageMetadata };
type FakeEvent = { EventID: string; Messages?: FakeMessageEvent[] };

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

/**
 * in-memory mailbox serving the routes IndexApi uses: the metadata listing, the body batch, the latest event
 * and the events following an event id, one event per page
 */
class FakeMailApi {
    readonly messages = new Map<string, StoredMessage>();
    latestEventID = 'latest-event';
    readonly events: FakeEvent[] = [{ EventID: 'latest-event' }];
    readonly requests: ApiConfig[] = [];
    /** how many more times the events since an event id answer like a lagging replica: that id, with More */
    readonly staleResponses = new Map<string, number>();
    private blocked?: { predicate: (config: ApiConfig) => boolean; onArrived: () => void };
    private failing?: (config: ApiConfig) => boolean;

    add(...messages: StoredMessage[]) {
        for (const m of messages) {
            this.messages.set(m.metadata.ID, m);
        }
    }

    addEvent(EventID: string, Messages: FakeMessageEvent[] = []) {
        this.events.push({ EventID, Messages });
        this.latestEventID = EventID;
    }

    /** the next request matching the predicate hangs until aborted; resolves once it arrives */
    block(predicate: (config: ApiConfig) => boolean): Promise<void> {
        return new Promise((resolve) => {
            this.blocked = { predicate, onArrived: resolve };
        });
    }

    /** every request matching the predicate fails, like a network error */
    fail(predicate: (config: ApiConfig) => boolean) {
        this.failing = predicate;
    }

    readonly api = async (config: ApiConfig) => {
        this.requests.push(config);
        if (this.failing?.(config)) {
            throw new Error(`request failed: ${config.url}`);
        }
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
        if (config.method === 'get' && config.url.startsWith('core/v5/events/')) {
            return this.eventsSince(config.url.slice('core/v5/events/'.length));
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

    private eventsSince(eventID: string) {
        const stale = this.staleResponses.get(eventID) ?? 0;
        if (stale > 0) {
            this.staleResponses.set(eventID, stale - 1);
            return { Code: 1000, EventID: eventID, More: 1, Refresh: 0 };
        }
        const index = this.events.findIndex((e) => e.EventID === eventID);
        if (index === -1) {
            return { Code: 1000, EventID: this.events.at(-1)!.EventID, More: 0, Refresh: 255 };
        }
        const next = this.events[index + 1];
        if (!next) {
            return { Code: 1000, EventID: eventID, More: 0, Refresh: 0 };
        }
        return { Code: 1000, ...next, More: index + 2 < this.events.length ? 1 : 0, Refresh: 0 };
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
        reportHistoricProgress: vi.fn(),
        reportIndexComplete: vi.fn(),
        reportTaskStarted: vi.fn(),
        reportTaskCompleted: vi.fn(),
        reportError: vi.fn(),
        log: vi.fn(),
        reportExpressionMatches: vi.fn(),
        reportDeleted: vi.fn(),
        listOpenSearches: vi.fn(async (): Promise<ReadonlyMap<string, string>> => {
            return new Map();
        }),
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
    /** what the test inspects the index with, freed after each test */
    let readerEngine: Engine | undefined;
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
        readerEngine?.free();
        readerEngine = undefined;
    });

    const createWorker = (catchupBackoff?: ExponentialBackoff) => {
        const bridge = new MailApiBridge(fakeApi.api as any, decryptMessageBody, logger);
        return new IndexWorker(
            userId,
            indexKey,
            bridge as unknown as Comlink.Remote<MailApiBridge>,
            listener,
            catchupBackoff
        );
    };

    // the worker closes its db when done, so open our own to inspect the result
    const openDB = async () => {
        db = await openContentSearchDB(userId);
        return db;
    };

    const openReader = async () => {
        readerEngine ??= createMailSearchEngine();
        return new IndexReader(await openDB(), indexKey, readerEngine);
    };

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
            listener.reportTaskStarted.mockClear();

            const second = createWorker();
            second.pushStartupAction();
            await second.start();

            // only catch-up asks for the events since the cursor
            expect(fakeApi.requests.slice(requestCount).map((r) => r.url)).toEqual(['core/v5/events/latest-event']);
            // nor is it reported as started, so a finished index doesn't show as being indexed again
            expect(listener.reportTaskStarted.mock.calls).toEqual([['catchup']]);
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

            const metadataRequests = () => {
                return fakeApi.requests.filter((r) => r.url === 'mail/v4/messages');
            };
            const metadataRequestsBefore = metadataRequests().length;
            const second = createWorker();
            second.pushStartupAction();
            await second.start();

            // picked up after message 59 instead of starting over
            const resumedRequests = metadataRequests().slice(metadataRequestsBefore);
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
                refresh: false,
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
            expect(listener.log).toHaveBeenCalledWith(
                'info',
                'applied event update with 3 messages: 1 with body, 1 metadata only, 1 deleted'
            );
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
                refresh: false,
            });
            await worker.start();

            expect(listener.reportTaskStarted.mock.calls).toEqual([['incremental'], ['historic']]);
            const reader = await openReader();
            expect(await reader.getAllIds()).toHaveLength(6);
            // the incremental update already set a cursor, historic indexing must not replace it
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-1' });
            expect(fakeApi.requests.some((r) => r.url === 'core/v4/events/latest')).toBe(false);
        });

        it('rebuilds the index on a refresh, keeping the live updates queued after it', async () => {
            fakeApi.add(...makeMailbox(3, { 1: 'deleted during the refresh' }));
            const initial = createWorker();
            initial.pushStartupAction();
            await initial.start();
            listener.reportTaskStarted.mockClear();
            listener.reportIndexComplete.mockClear();
            fakeApi.messages.delete('message-001');
            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            fakeApi.latestEventID = 'event-2';

            const worker = createWorker();
            worker.pushIncrementalUpdate({ eventID: 'event-1', items: [], refresh: true });
            worker.pushIncrementalUpdate({
                eventID: 'event-2',
                items: [{ metadata: created.metadata, fetchBodyId: created.metadata.ID }],
                refresh: false,
            });
            await worker.start();

            expect(listener.reportTaskStarted.mock.calls).toEqual([['incremental'], ['historic']]);
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
            const reader = await openReader();
            expect((await reader.getAllIds()).sort()).toEqual(['message-000', 'message-002', 'message-010']);
            expect(await searchKeyword(reader, 'deleted')).toEqual([]);
            expect(await searchKeyword(reader, 'giraffe')).toEqual(['message-010']);
            // the live update after the refresh is the start of the rebuilt index
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-2' });
        });

        it('stops accepting work once it ran to completion', async () => {
            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();

            expect(worker.pushStartupAction()).toBe(false);
            expect(worker.pushIncrementalUpdate({ eventID: 'event-1', items: [], refresh: false })).toBe(false);
        });
    });

    describe('open searches', () => {
        const expressionOf = (keyword: string, labelIDs: string[] = []) => {
            const params = {
                labelIDs,
                sort: { sort: 'Time', desc: true },
                filter: {},
                search: { keyword },
                normalizedKeywords: undefined,
            } as unknown as NormalizedSearchParams;
            const expression = buildQuery(params);
            try {
                return expression.toString();
            } finally {
                expression.free();
            }
        };

        /** what the leader's open search directory lists */
        const openSearches = (searches: ReadonlyMap<string, string>) => {
            listener.listOpenSearches.mockResolvedValue(searches);
        };

        /** what was reported for each search, every call merged */
        const reportedMatches = () => {
            const bySearch: Record<string, { matched: string[]; unmatched: string[] }> = {};
            for (const [searchId, { matched, unmatched }] of listener.reportExpressionMatches.mock.calls) {
                bySearch[searchId] ??= { matched: [], unmatched: [] };
                bySearch[searchId].matched.push(...matched);
                bySearch[searchId].unmatched.push(...unmatched);
            }
            for (const matches of Object.values(bySearch)) {
                matches.matched.sort();
                matches.unmatched.sort();
            }
            return bySearch;
        };

        it('reports what a live update wrote that each search matches now, but not the deleted messages', async () => {
            fakeApi.add(...makeMailbox(3, { 1: 'soon deleted', 2: 'keeps its walrus body' }));
            const initial = createWorker();
            initial.pushStartupAction();
            await initial.start();

            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            const relabeled = { ...fakeApi.messages.get('message-002')!.metadata, LabelIDs: ['0', '10'] };
            const worker = createWorker();
            openSearches(
                new Map([
                    ['giraffes', expressionOf('giraffe')],
                    ['walruses-in-10', expressionOf('walrus', ['10'])],
                ])
            );
            worker.pushIncrementalUpdate({
                eventID: 'event-1',
                items: [
                    { metadata: created.metadata, fetchBodyId: created.metadata.ID },
                    { deleteId: 'message-001' },
                    { metadata: relabeled },
                ],
                refresh: false,
            });
            await worker.start();

            expect(reportedMatches()).toEqual({
                giraffes: { matched: ['message-010'], unmatched: ['message-002'] },
                'walruses-in-10': { matched: ['message-002'], unmatched: ['message-010'] },
            });
        });

        it('reports the messages a live update or catch-up deleted, once committed', async () => {
            fakeApi.add(...makeMailbox(3));
            const initial = createWorker();
            initial.pushStartupAction();
            await initial.start();
            fakeApi.messages.delete('message-000');
            fakeApi.messages.delete('message-001');
            fakeApi.addEvent('event-1', [{ ID: 'message-001', Action: EVENT_ACTIONS.DELETE }]);

            const worker = createWorker();
            worker.pushStartupAction();
            worker.pushIncrementalUpdate({ eventID: 'event-2', items: [{ deleteId: 'message-000' }], refresh: false });
            await worker.start();

            expect(listener.reportDeleted.mock.calls).toEqual([[['message-001']], [['message-000']]]);
            const reader = await openReader();
            expect((await reader.getAllIds()).sort()).toEqual(['message-002']);
        });

        it('matches what an interrupted matching left before it stops', async () => {
            fakeApi.add(...makeMailbox(3));
            const initial = createWorker();
            initial.pushStartupAction();
            await initial.start();
            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            const searches = new Map([['giraffes', expressionOf('giraffe')]]);
            openSearches(searches);
            let finishListing: (() => void) | undefined;
            listener.listOpenSearches.mockImplementationOnce(() => {
                return new Promise((resolve) => {
                    finishListing = () => {
                        resolve(searches);
                    };
                });
            });

            const worker = createWorker();
            worker.pushIncrementalUpdate({
                eventID: 'event-1',
                items: [{ metadata: created.metadata, fetchBodyId: created.metadata.ID }],
                refresh: false,
            });
            const run = worker.start();
            await vi.waitFor(() => {
                expect(finishListing).toBeDefined();
            });
            // a search interrupts indexing while it matches what it just wrote
            const stopped = worker.stop();
            finishListing!();
            await stopped;
            await run;
            expect(reportedMatches()).toEqual({});
            listener.reportIndexComplete.mockClear();

            // indexing resumes once the search is done, with nothing left to write
            await worker.start();

            expect(reportedMatches()).toEqual({ giraffes: { matched: ['message-010'], unmatched: [] } });
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
        });

        it('reports what catch-up wrote', async () => {
            fakeApi.add(...makeMailbox(3));
            const initial = createWorker();
            initial.pushStartupAction();
            await initial.start();
            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            fakeApi.addEvent('event-1', [
                { ID: created.metadata.ID, Action: EVENT_ACTIONS.CREATE, Message: created.metadata },
            ]);

            const worker = createWorker();
            openSearches(new Map([['giraffes', expressionOf('giraffe')]]));
            worker.pushStartupAction();
            await worker.start();

            expect(reportedMatches()).toEqual({ giraffes: { matched: ['message-010'], unmatched: [] } });
        });

        it('reports each page historic indexing wrote', async () => {
            fakeApi.add(...makeMailbox(70, { 3: 'the zebra crossing', 65: 'a zebra on the last page' }));
            const worker = createWorker();
            openSearches(new Map([['zebras', expressionOf('zebra')]]));

            worker.pushStartupAction();
            await worker.start();

            expect(listener.reportExpressionMatches).toHaveBeenCalledTimes(2);
            const { zebras } = reportedMatches();
            expect(zebras.matched).toEqual(['message-003', 'message-065']);
            expect(zebras.unmatched).toHaveLength(68);
        });

        it('matches with the engine it writes with, rather than one per run', async () => {
            fakeApi.add(...makeMailbox(3));
            vi.mocked(createMailSearchEngine).mockClear();
            const worker = createWorker();

            worker.pushStartupAction();
            await worker.start();
            // a search interrupted it, it runs again
            await worker.start();

            expect(createMailSearchEngine).toHaveBeenCalledTimes(1);
        });

        it('reads nothing back when no search is open', async () => {
            fakeApi.add(...makeMailbox(5));
            const startReadTxn = vi.spyOn(BlobTxnProvider.prototype, 'startReadTxn');
            const worker = createWorker();

            worker.pushStartupAction();
            await worker.start();

            expect(startReadTxn).not.toHaveBeenCalled();
            expect(listener.reportExpressionMatches).not.toHaveBeenCalled();
            startReadTxn.mockRestore();
        });
    });

    describe('catch-up', () => {
        const indexMailbox = async () => {
            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();
            listener.reportTaskStarted.mockClear();
            listener.reportIndexComplete.mockClear();
        };

        const eventRequests = () => {
            return fakeApi.requests.filter((r) => r.url.startsWith('core/v5/events/')).map((r) => r.url);
        };

        it('applies the events since the cursor, following More until the end, and advances the cursor', async () => {
            fakeApi.add(...makeMailbox(3, { 1: 'soon deleted', 2: 'keeps its walrus body' }));
            await indexMailbox();
            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            const relabeled = { ...fakeApi.messages.get('message-002')!.metadata, LabelIDs: ['0', '10'] };
            fakeApi.addEvent('event-1', [
                { ID: created.metadata.ID, Action: EVENT_ACTIONS.CREATE, Message: created.metadata },
            ]);
            fakeApi.addEvent('event-2', [{ ID: 'message-001', Action: EVENT_ACTIONS.DELETE }]);
            fakeApi.addEvent('event-3', [
                { ID: 'message-002', Action: EVENT_ACTIONS.UPDATE_FLAGS, Message: relabeled },
            ]);

            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();

            const reader = await openReader();
            expect((await reader.getAllIds()).sort()).toEqual(['message-000', 'message-002', 'message-010']);
            expect(await searchKeyword(reader, 'giraffe')).toEqual(['message-010']);
            expect(await searchKeyword(reader, 'deleted')).toEqual([]);
            expect(await searchKeyword(reader, 'walrus', ['10'])).toEqual(['message-002']);
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-3' });
            expect(eventRequests()).toEqual([
                'core/v5/events/latest-event',
                'core/v5/events/event-1',
                'core/v5/events/event-2',
            ]);
            expect(listener.reportTaskStarted.mock.calls).toEqual([['catchup']]);
        });

        it('advances the cursor past events without message changes', async () => {
            await indexMailbox();
            fakeApi.addEvent('event-1');

            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();

            await openDB();
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-1' });
        });

        it('resumes from the last committed event after being stopped', async () => {
            fakeApi.add(...makeMailbox(2));
            await indexMailbox();
            const first = makeMessage(10, 'first giraffe');
            const second = makeMessage(11, 'second zebra');
            fakeApi.add(first, second);
            fakeApi.addEvent('event-1', [
                { ID: first.metadata.ID, Action: EVENT_ACTIONS.CREATE, Message: first.metadata },
            ]);
            fakeApi.addEvent('event-2', [
                { ID: second.metadata.ID, Action: EVENT_ACTIONS.CREATE, Message: second.metadata },
            ]);
            const secondBodyRequested = fakeApi.block((config) => {
                return config.url === 'mail/v4/messages/batch' && config.data!.MessageIDs.includes(second.metadata.ID);
            });

            const stopped = createWorker();
            stopped.pushStartupAction();
            const run = stopped.start();
            await secondBodyRequested;
            await stopped.stop();
            await run;

            await openDB();
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-1' });
            db!.close();
            db = undefined;

            const requestsBefore = eventRequests().length;
            const resumed = createWorker();
            resumed.pushStartupAction();
            await resumed.start();

            expect(eventRequests().slice(requestsBefore)).toEqual(['core/v5/events/event-1']);
            const reader = await openReader();
            expect(await searchKeyword(reader, 'giraffe')).toEqual(['message-010']);
            expect(await searchKeyword(reader, 'zebra')).toEqual(['message-011']);
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-2' });
        });

        it('does nothing and is not reported without a cursor', async () => {
            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();

            expect(eventRequests()).toEqual([]);
            expect(listener.reportTaskStarted.mock.calls).toEqual([['historic']]);
        });

        it('runs before queued live updates, which replay idempotently', async () => {
            fakeApi.add(...makeMailbox(2, { 1: 'soon deleted' }));
            await indexMailbox();
            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            const createEvent = { ID: created.metadata.ID, Action: EVENT_ACTIONS.CREATE, Message: created.metadata };
            fakeApi.addEvent('event-1', [createEvent]);
            fakeApi.addEvent('event-2', [{ ID: 'message-001', Action: EVENT_ACTIONS.DELETE }]);

            const worker = createWorker();
            worker.pushStartupAction();
            // the live event loop delivers event-2 again, catch-up already covered it
            worker.pushIncrementalUpdate({
                eventID: 'event-2',
                items: [{ metadata: created.metadata, fetchBodyId: created.metadata.ID }, { deleteId: 'message-001' }],
                refresh: false,
            });
            await worker.start();

            expect(listener.reportTaskStarted.mock.calls).toEqual([['catchup'], ['incremental']]);
            expect(eventRequests()[0]).toBe('core/v5/events/latest-event');
            const reader = await openReader();
            expect((await reader.getAllIds()).sort()).toEqual(['message-000', 'message-010']);
            expect(await searchKeyword(reader, 'giraffe')).toEqual(['message-010']);
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-2' });
        });

        it('runs on request without the startup action, before the live update that follows the missed events', async () => {
            fakeApi.add(...makeMailbox(2));
            await indexMailbox();
            listener.reportTaskCompleted.mockClear();
            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            fakeApi.addEvent('event-1', [
                { ID: created.metadata.ID, Action: EVENT_ACTIONS.CREATE, Message: created.metadata },
            ]);
            fakeApi.addEvent('event-2', [{ ID: 'message-001', Action: EVENT_ACTIONS.DELETE }]);

            const worker = createWorker();
            worker.pushCatchup();
            worker.pushIncrementalUpdate({ eventID: 'event-2', items: [{ deleteId: 'message-001' }], refresh: false });
            await worker.start();

            expect(listener.reportTaskCompleted.mock.calls).toEqual([
                ['catchup', true],
                ['incremental', true],
            ]);
            const reader = await openReader();
            expect((await reader.getAllIds()).sort()).toEqual(['message-000', 'message-010']);
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-2' });
        });

        it('does not run for a worker started by a live update alone', async () => {
            fakeApi.add(...makeMailbox(2));
            await indexMailbox();
            fakeApi.addEvent('event-1');
            fakeApi.addEvent('event-2', [{ ID: 'message-001', Action: EVENT_ACTIONS.DELETE }]);

            const worker = createWorker();
            worker.pushIncrementalUpdate({ eventID: 'event-2', items: [{ deleteId: 'message-001' }], refresh: false });
            await worker.start();

            expect(listener.reportTaskStarted.mock.calls).toEqual([['incremental']]);
            expect(eventRequests()).toEqual([]);
        });

        it('reports a failed run as completed without success', async () => {
            fakeApi.add(...makeMailbox(2));
            await indexMailbox();
            listener.reportTaskCompleted.mockClear();
            fakeApi.addEvent('event-1');
            fakeApi.fail((config) => {
                return config.url.startsWith('core/v5/events/');
            });

            const worker = createWorker();
            worker.pushCatchup();

            await expect(worker.start()).rejects.toThrow('request failed');
            expect(listener.reportTaskCompleted.mock.calls).toEqual([['catchup', false]]);
        });

        it('reports a stopped run as completed without success', async () => {
            fakeApi.add(...makeMailbox(2));
            await indexMailbox();
            listener.reportTaskCompleted.mockClear();
            fakeApi.addEvent('event-1');
            const eventsRequested = fakeApi.block((config) => {
                return config.url.startsWith('core/v5/events/');
            });

            const worker = createWorker();
            worker.pushCatchup();
            const run = worker.start();
            await eventsRequested;
            await worker.stop();
            await run;

            expect(listener.reportTaskCompleted.mock.calls).toEqual([['catchup', false]]);
        });

        it('rebuilds the index when the events since the cursor cannot be replayed', async () => {
            fakeApi.add(...makeMailbox(3, { 1: 'deleted while the cursor expired' }));
            await indexMailbox();
            // the cursor is past the event lifetime: the server answers with a refresh
            fakeApi.events.splice(0, fakeApi.events.length, { EventID: 'event-9' });
            fakeApi.latestEventID = 'event-9';
            fakeApi.messages.delete('message-001');
            fakeApi.add(makeMessage(10, 'arrived while the cursor expired'));

            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();

            expect(listener.reportTaskStarted.mock.calls).toEqual([['catchup'], ['historic']]);
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
            const reader = await openReader();
            expect((await reader.getAllIds()).sort()).toEqual(['message-000', 'message-002', 'message-010']);
            expect(await searchKeyword(reader, 'deleted')).toEqual([]);
            expect(await searchKeyword(reader, 'arrived')).toEqual(['message-010']);
            expect(await db!.get('message_cache', 'message-001')).toBeUndefined();
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-9' });
            expect(await db!.get('anchors', 'historic')).toEqual(expect.objectContaining({ eof: true }));
        });

        it('backs off while the server returns the cursor with More, and resets the delay once it advances', async () => {
            await indexMailbox();
            const created = makeMessage(10, 'a brand new giraffe');
            fakeApi.add(created);
            fakeApi.addEvent('event-1', [
                { ID: created.metadata.ID, Action: EVENT_ACTIONS.CREATE, Message: created.metadata },
            ]);
            fakeApi.addEvent('event-2');
            fakeApi.staleResponses.set('latest-event', 6);
            fakeApi.staleResponses.set('event-1', 1);
            const delays: number[] = [];
            const backoff = new ExponentialBackoff(1000, 30_000, {
                setTimeout: (callback, ms) => {
                    delays.push(ms);
                    queueMicrotask(callback);
                },
                clearTimeout: () => {},
            });

            const worker = createWorker(backoff);
            worker.pushStartupAction();
            await worker.start();

            expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 1000]);
            expect(eventRequests()).toEqual([
                ...Array(7).fill('core/v5/events/latest-event'),
                'core/v5/events/event-1',
                'core/v5/events/event-1',
            ]);
            const reader = await openReader();
            expect(await searchKeyword(reader, 'giraffe')).toEqual(['message-010']);
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-2' });
        });

        it('keeps the cursor when stopped while backing off, and live updates wait for catch-up', async () => {
            await indexMailbox();
            fakeApi.addEvent('event-1');
            fakeApi.staleResponses.set('latest-event', 1);
            const clearTimeout = vi.fn();
            let backoff!: ExponentialBackoff;
            const waitStarted = new Promise<void>((resolve) => {
                backoff = new ExponentialBackoff(1000, 30_000, {
                    // never fires, only the stop ends the wait
                    setTimeout: () => {
                        resolve();
                        return 'timer';
                    },
                    clearTimeout,
                });
            });

            const worker = createWorker(backoff);
            worker.pushStartupAction();
            worker.pushIncrementalUpdate({ eventID: 'event-1', items: [], refresh: false });
            const run = worker.start();
            await waitStarted;
            await worker.stop();
            await run;

            expect(listener.reportTaskStarted.mock.calls).toEqual([['catchup']]);
            expect(listener.reportError).not.toHaveBeenCalled();
            expect(clearTimeout).toHaveBeenCalledWith('timer');
            await openDB();
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'latest-event' });
        });

        it('runs before an unfinished historic pass', async () => {
            fakeApi.add(...makeMailbox(70));
            const secondPageRequested = fakeApi.block((config) => config.params?.EndID !== undefined);
            const interrupted = createWorker();
            interrupted.pushStartupAction();
            const run = interrupted.start();
            await secondPageRequested;
            await interrupted.stop();
            await run;
            const created = makeMessage(-1, 'a brand new giraffe');
            fakeApi.add(created);
            fakeApi.addEvent('event-1', [
                { ID: created.metadata.ID, Action: EVENT_ACTIONS.CREATE, Message: created.metadata },
            ]);

            const worker = createWorker();
            worker.pushStartupAction();
            await worker.start();

            expect(listener.reportTaskStarted.mock.calls).toEqual([['historic'], ['catchup'], ['historic']]);
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
            const reader = await openReader();
            expect(await reader.getAllIds()).toHaveLength(71);
            expect(await searchKeyword(reader, 'giraffe')).toEqual([created.metadata.ID]);
            expect(await db!.get('event_cursor', 'event_cursor')).toEqual({ eventID: 'event-1' });
        });
    });
});
