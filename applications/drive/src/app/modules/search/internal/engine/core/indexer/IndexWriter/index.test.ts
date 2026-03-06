import 'fake-indexeddb/auto';

import { IndexWriter } from '.';
import { EngineDB } from '../../../storage/EngineDB';

// ─── Module stubs ────────────────────────────────────────────────────────────
// @proton/proton-foundation-search is ESM-only and cannot be loaded by Jest's
// CJS runtime without a transformIgnorePatterns change. We stub only the four
// runtime exports that IndexWriter.ts actually calls — Document, Value, SerDes,
// WriteEventKind. Engine / Write / Execution are imported as `import type` and
// have no runtime presence, so they need no stub.
jest.mock('@proton/proton-foundation-search', () => ({
    Document: class Document {
        constructor(public readonly _id: string) {}
        addAttribute(_name: string, _value: unknown) {}
    },
    Value: {
        tag: (v: string) => v,
        text: (v: string) => v,
        bool: (v: boolean) => v,
        int: (v: bigint) => v,
    },
    // Enum values must match the constants used in our event doubles below.
    SerDes: { Cbor: 2 },
    WriteEventKind: { Load: 0, Save: 1, Stats: 2 },
}));

jest.mock('../../../../Logger', () => ({
    Logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

// ─── Search Library WASM API constants ──────────────────────────────────────────────────────
// Keep local copies so event doubles and assertions don't depend on the stub.
const WriteEventKind = { Load: 0, Save: 1, Stats: 2 } as const;
const SerDes = { Cbor: 2 } as const;

// ─── Test-double builders ────────────────────────────────────────────────────
// These implement only the subset of the WASM Write / Execution surface that
// WriteSession actually calls. No jest.mock('@proton/proton-foundation-search').

type EventSpec =
    | { type: 'load'; blobName: string }
    | { type: 'save'; blobName: string; bytes: Uint8Array<ArrayBuffer> }
    | { type: 'stats' };

function buildEvents(specs: EventSpec[]) {
    return specs.map((spec) => {
        switch (spec.type) {
            case 'load':
                return {
                    kind: () => WriteEventKind.Load,
                    id: () => ({ toString: () => spec.blobName }),
                    sendEmpty: jest.fn(),
                    send: jest.fn(),
                };
            case 'save':
                return {
                    kind: () => WriteEventKind.Save,
                    id: () => ({ toString: () => spec.blobName }),
                    recv: () => ({ serialize: (_s: number) => ({ buffer: spec.bytes.buffer as ArrayBuffer }) }),
                };
            case 'stats':
                return { kind: () => WriteEventKind.Stats, free: jest.fn() };
        }
    });
}

function makeRig(eventSpecs: EventSpec[] = []) {
    const events = buildEvents(eventSpecs);
    let cursor = 0;

    const executionFree = jest.fn();
    const execution = {
        next: () => events[cursor++],
        free: executionFree,
    };

    const writeFree = jest.fn();
    const writeHandle = {
        insert: jest.fn(),
        commit: jest.fn(() => execution),
        free: writeFree,
    };

    const engine = { write: jest.fn(() => writeHandle) };

    return { engine, writeHandle, writeFree, execution, executionFree, events };
}

async function openDB(): Promise<EngineDB> {
    return EngineDB.open('user1', 'engine1');
}

beforeEach(() => {
    // Fresh IDB instance per test — mirrors EngineDB.test.ts convention.
    indexedDB = new IDBFactory();
});

describe('IndexWriter.startWriteSession()', () => {
    it('throws when a session is already open', async () => {
        const db = await openDB();
        const { engine } = makeRig();
        const writer = new IndexWriter(db, 'v1', engine as any);

        const session = writer.startWriteSession();
        expect(() => writer.startWriteSession()).toThrow('a write session is already in progress');
        session.dispose();
    });

    it('succeeds after the previous session is aborted', async () => {
        const db = await openDB();
        const { engine } = makeRig();
        const writer = new IndexWriter(db, 'v1', engine as any);

        writer.startWriteSession().dispose();

        expect(() => writer.startWriteSession().dispose()).not.toThrow();
    });

    it('succeeds after the previous session is committed', async () => {
        const db = await openDB();
        const { engine } = makeRig();
        const writer = new IndexWriter(db, 'v1', engine as any);

        await writer.startWriteSession().commit();

        expect(() => writer.startWriteSession().dispose()).not.toThrow();
    });
});

describe('WriteSession.dispose()', () => {
    it('calls Write.free() to release the WASM handle', async () => {
        const db = await openDB();
        const { engine, writeFree } = makeRig();
        const writer = new IndexWriter(db, 'v1', engine as any);

        writer.startWriteSession().dispose();

        expect(writeFree).toHaveBeenCalledTimes(1);
    });

    it('is idempotent — Write.free() is not called on the second dispose()', async () => {
        const db = await openDB();
        const { engine, writeFree } = makeRig();
        const writer = new IndexWriter(db, 'v1', engine as any);

        const session = writer.startWriteSession();
        session.dispose();
        session.dispose();

        expect(writeFree).toHaveBeenCalledTimes(1);
    });

    it('releases the session lock so the next startWriteSession() does not throw', async () => {
        const db = await openDB();
        const { engine } = makeRig();
        const writer = new IndexWriter(db, 'v1', engine as any);

        writer.startWriteSession().dispose();

        expect(() => writer.startWriteSession().dispose()).not.toThrow();
    });
});

describe('WriteSession.insert()', () => {
    it('does not call Write.free() when WASM throws — the library already freed it', async () => {
        const db = await openDB();
        const { engine, writeFree, writeHandle } = makeRig();
        writeHandle.insert.mockImplementation(() => {
            throw new Error('WASM insert error');
        });
        const writer = new IndexWriter(db, 'v1', engine as any);

        expect(() => writer.startWriteSession().insert({ documentId: 'a', attributes: [] })).toThrow(
            'Search library WASM failed during insert'
        );

        expect(writeFree).not.toHaveBeenCalled();
    });

    it('releases the session lock when WASM throws so a new session can be started', async () => {
        const db = await openDB();
        const { engine, writeHandle } = makeRig();
        writeHandle.insert.mockImplementationOnce(() => {
            throw new Error('WASM insert error');
        });
        const writer = new IndexWriter(db, 'v1', engine as any);

        expect(() => writer.startWriteSession().insert({ documentId: 'a', attributes: [] })).toThrow();

        expect(() => writer.startWriteSession().dispose()).not.toThrow();
    });

    it('dispose() after WASM throws is a no-op — writer is already null', async () => {
        const db = await openDB();
        const { engine, writeFree, writeHandle } = makeRig();
        writeHandle.insert.mockImplementation(() => {
            throw new Error('WASM insert error');
        });
        const writer = new IndexWriter(db, 'v1', engine as any);
        const session = writer.startWriteSession();

        expect(() => session.insert({ documentId: 'a', attributes: [] })).toThrow();
        session.dispose(); // must not call Write.free() again

        expect(writeFree).not.toHaveBeenCalled();
    });

    it('throws "session already released" when called after dispose()', async () => {
        const db = await openDB();
        const { engine } = makeRig();
        const writer = new IndexWriter(db, 'v1', engine as any);
        const session = writer.startWriteSession();
        session.dispose();

        expect(() => session.insert({ documentId: 'a', attributes: [] })).toThrow('session already released');
    });
});

describe('WriteSession.commit() — Execution.free()', () => {
    it('calls Execution.free() after a clean commit with no events', async () => {
        const db = await openDB();
        const { engine, executionFree } = makeRig();
        const writer = new IndexWriter(db, 'v1', engine as any);

        await writer.startWriteSession().commit();

        expect(executionFree).toHaveBeenCalledTimes(1);
    });

    it('calls Execution.free() after processing Load + Save + Stats events', async () => {
        const db = await openDB();
        const { engine, executionFree } = makeRig([
            { type: 'load', blobName: 'seg-0' },
            { type: 'save', blobName: 'seg-0', bytes: new Uint8Array([1, 2, 3]) },
            { type: 'stats' },
        ]);
        const writer = new IndexWriter(db, 'v1', engine as any);

        await writer.startWriteSession().commit();

        expect(executionFree).toHaveBeenCalledTimes(1);
    });

    it('calls Execution.free() even when db.putIndexBlob throws during a Save event', async () => {
        const db = await openDB();
        const { engine, executionFree } = makeRig([
            { type: 'save', blobName: 'seg-0', bytes: new Uint8Array([1, 2, 3]) },
        ]);
        jest.spyOn(db, 'putIndexBlob').mockRejectedValue(new Error('quota exceeded'));
        const writer = new IndexWriter(db, 'v1', engine as any);

        await expect(writer.startWriteSession().commit()).rejects.toThrow('quota exceeded');

        expect(executionFree).toHaveBeenCalledTimes(1);
    });

    it('releases the session lock even when db.putIndexBlob throws', async () => {
        const db = await openDB();
        const { engine } = makeRig([{ type: 'save', blobName: 'seg-0', bytes: new Uint8Array([1, 2, 3]) }]);
        jest.spyOn(db, 'putIndexBlob').mockRejectedValue(new Error('quota exceeded'));
        const writer = new IndexWriter(db, 'v1', engine as any);

        await expect(writer.startWriteSession().commit()).rejects.toThrow();

        expect(() => writer.startWriteSession().dispose()).not.toThrow();
    });

    it('throws "session already released" when called after dispose()', async () => {
        const db = await openDB();
        const { engine } = makeRig();
        const writer = new IndexWriter(db, 'v1', engine as any);
        const session = writer.startWriteSession();
        session.dispose();

        await expect(session.commit()).rejects.toThrow('session already released');
    });
});

describe('WriteSession.commit() — event handling', () => {
    it('calls sendEmpty() for a Load event when the blob is not in IndexedDB', async () => {
        const db = await openDB();
        const { engine, events } = makeRig([{ type: 'load', blobName: 'seg-0' }]);
        const writer = new IndexWriter(db, 'v1', engine as any);

        await writer.startWriteSession().commit();

        const loadEvent = events[0] as ReturnType<typeof buildEvents>[number] & { sendEmpty: jest.Mock };
        expect(loadEvent.sendEmpty).toHaveBeenCalledTimes(1);
    });

    it('calls send() with the stored bytes for a Load event when the blob exists', async () => {
        const db = await openDB();
        const storedBytes = new Uint8Array([7, 8, 9]);
        await db.putIndexBlob('v1', 'seg-0', storedBytes.buffer as ArrayBuffer);

        const { engine, events } = makeRig([{ type: 'load', blobName: 'seg-0' }]);
        const writer = new IndexWriter(db, 'v1', engine as any);

        await writer.startWriteSession().commit();

        const loadEvent = events[0] as ReturnType<typeof buildEvents>[number] & { send: jest.Mock };
        expect(loadEvent.send).toHaveBeenCalledWith(SerDes.Cbor, new Uint8Array([7, 8, 9]));
    });

    it('persists the serialized bytes from a Save event to IndexedDB', async () => {
        const db = await openDB();
        const bytes = new Uint8Array([10, 20, 30]);
        const { engine } = makeRig([{ type: 'save', blobName: 'seg-0', bytes }]);
        const writer = new IndexWriter(db, 'v1', engine as any);

        await writer.startWriteSession().commit();

        const stored = await db.getIndexBlob('v1', 'seg-0');
        if (stored === undefined) {
            throw new Error('expected blob to be stored');
        }
        expect(new Uint8Array(stored)).toEqual(bytes);
    });

    it('calls event.free() for Stats events', async () => {
        const db = await openDB();
        const { engine, events } = makeRig([{ type: 'stats' }]);
        const writer = new IndexWriter(db, 'v1', engine as any);

        await writer.startWriteSession().commit();

        const statsEvent = events[0] as ReturnType<typeof buildEvents>[number] & { free: jest.Mock };
        expect(statsEvent.free).toHaveBeenCalledTimes(1);
    });
});
