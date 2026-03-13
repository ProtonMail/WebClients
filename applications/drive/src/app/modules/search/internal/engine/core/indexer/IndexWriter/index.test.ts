import 'fake-indexeddb/auto';

import { Engine as SearchLibraryWasmEngine } from '@proton/proton-foundation-search';

import { IndexWriter } from '.';
import { SearcherV1 } from '../../../configs/v1/searcher/SearcherV1';
import { EngineDB } from '../../../storage/EngineDB';
import { setupRealSearchLibraryWasm } from '../../../testing/setupRealSearchLibraryWasm';
import type { IndexEntry } from '../types';

setupRealSearchLibraryWasm();

jest.mock('../../../../Logger', () => ({
    Logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

const CONFIG_KEY = 'v1';

function makeEntry(id: string, filename: string): IndexEntry {
    return {
        documentId: id,
        attributes: [{ name: 'filename', value: { kind: 'text', value: filename } }],
    };
}

async function searchFor(engine: SearchLibraryWasmEngine, db: EngineDB, query: string): Promise<string[]> {
    await db.setEngineState({ activeConfigKey: CONFIG_KEY });
    const searcher = new SearcherV1({ engine, db });
    const nodeUids: string[] = [];
    for await (const item of searcher.performSearch({ filename: query }, CONFIG_KEY)) {
        nodeUids.push(item.nodeUid);
    }
    return nodeUids;
}

beforeEach(() => {
    indexedDB = new IDBFactory();
});

describe('IndexWriter — write then read with real WASM', () => {
    it('indexed documents are findable by search after commit', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);

        const session = writer.startWriteSession();
        session.insert(makeEntry('uid-111', 'meeting notes'));
        session.insert(makeEntry('uid-222', 'vacation photos'));
        await session.commit();

        const results = await searchFor(engine, db, 'meeting');
        expect(results).toContain('uid-111');
        expect(results).not.toContain('uid-222');
    });

    it('multiple insert+commit cycles accumulate documents', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);

        const session1 = writer.startWriteSession();
        session1.insert(makeEntry('uid-111', 'project plan'));
        await session1.commit();

        const session2 = writer.startWriteSession();
        session2.insert(makeEntry('uid-222', 'project budget'));
        await session2.commit();

        const results = await searchFor(engine, db, 'project');
        expect(results).toContain('uid-111');
        expect(results).toContain('uid-222');
    });

    it('dispose() discards uncommitted inserts', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);

        // First commit something so the index exists
        const session1 = writer.startWriteSession();
        session1.insert(makeEntry('uid-111', 'committed document'));
        await session1.commit();

        // Insert but dispose without committing
        const session2 = writer.startWriteSession();
        session2.insert(makeEntry('uid-222', 'discarded document'));
        session2.dispose();

        const results = await searchFor(engine, db, 'document');
        expect(results).toContain('uid-111');
        expect(results).not.toContain('uid-222');
    });
});

describe('IndexWriter — session lifecycle', () => {
    it('throws when a session is already open', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);

        const session = writer.startWriteSession();
        expect(() => writer.startWriteSession()).toThrow('a write session is already in progress');
        session.dispose();
    });

    it('succeeds after the previous session is disposed', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);

        writer.startWriteSession().dispose();

        expect(() => writer.startWriteSession().dispose()).not.toThrow();
    });

    it('succeeds after the previous session is committed', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);

        await writer.startWriteSession().commit();

        expect(() => writer.startWriteSession().dispose()).not.toThrow();
    });

    it('insert after dispose throws "session already released"', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);
        const session = writer.startWriteSession();
        session.dispose();

        expect(() => session.insert(makeEntry('uid-111', 'test'))).toThrow('session already released');
    });

    it('commit after dispose throws "session already released"', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);
        const session = writer.startWriteSession();
        session.dispose();

        await expect(session.commit()).rejects.toThrow('session already released');
    });
});

describe('IndexWriter — error handling with spies', () => {
    it('propagates db.putIndexBlob errors through commit', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        jest.spyOn(db, 'putIndexBlob').mockRejectedValue(new Error('quota exceeded'));
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);

        const session = writer.startWriteSession();
        session.insert(makeEntry('uid-111', 'test'));

        await expect(session.commit()).rejects.toThrow('quota exceeded');
    });

    it('releases the session lock when commit fails', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        jest.spyOn(db, 'putIndexBlob').mockRejectedValue(new Error('quota exceeded'));
        const engine = SearchLibraryWasmEngine.builder().build();
        const writer = new IndexWriter(db, CONFIG_KEY, engine);

        const session = writer.startWriteSession();
        session.insert(makeEntry('uid-111', 'test'));
        await expect(session.commit()).rejects.toThrow();

        expect(() => writer.startWriteSession().dispose()).not.toThrow();
    });
});
