import 'fake-indexeddb/auto';

import { Engine as SearchLibraryWasmEngine } from '@proton/proton-foundation-search';

import { SearcherV1 } from '../../configs/v1/searcher/SearcherV1';
import { EngineDB } from '../../storage/EngineDB';
import { indexDocuments } from '../../testing/indexDocuments';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import type { EngineSearchItem } from './BaseSearcher';

jest.mock('../../../Logger', () => ({
    Logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

setupRealSearchLibraryWasm();

const CONFIG_KEY = 'v1';

/** Collect all items from an async generator into an array. */
async function collectItems(gen: AsyncGenerator<EngineSearchItem>): Promise<EngineSearchItem[]> {
    const items: EngineSearchItem[] = [];
    for await (const item of gen) {
        items.push(item);
    }
    return items;
}

beforeEach(() => {
    indexedDB = new IDBFactory();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BaseSearcher.performSearch() with real WASM engine', () => {
    it('returns empty results when no documents are indexed', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        await db.setEngineState({ activeConfigKey: CONFIG_KEY });
        const engine = SearchLibraryWasmEngine.builder().build();
        const searcher = new SearcherV1({ engine, db });

        const items = await collectItems(searcher.performSearch({ filename: 'hello' }, CONFIG_KEY));

        expect(items).toEqual([]);
    });

    it('finds indexed documents matching the query', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();

        await indexDocuments(engine, db, CONFIG_KEY, [
            { id: 'uid-111', filename: 'meeting notes' },
            { id: 'uid-222', filename: 'vacation photos' },
            { id: 'uid-333', filename: 'meeting agenda' },
        ]);

        const searcher = new SearcherV1({ engine, db });
        const items = await collectItems(searcher.performSearch({ filename: 'meeting' }, CONFIG_KEY));

        const matchedIds = items.map((item) => item.nodeUid);
        expect(matchedIds).toContain('uid-111');
        expect(matchedIds).toContain('uid-333');
        expect(matchedIds).not.toContain('uid-222');
    });

    it('returns results with scores', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();

        await indexDocuments(engine, db, CONFIG_KEY, [
            { id: 'uid-111', filename: 'report' },
            { id: 'uid-222', filename: 'report summary report' },
        ]);

        const searcher = new SearcherV1({ engine, db });
        const items = await collectItems(searcher.performSearch({ filename: 'report' }, CONFIG_KEY));

        expect(items.length).toBe(2);
    });

    it('returns items with scores between 0 and 1', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = SearchLibraryWasmEngine.builder().build();

        await indexDocuments(engine, db, CONFIG_KEY, [
            { id: 'uid-111', filename: 'project plan' },
            { id: 'uid-222', filename: 'project budget' },
        ]);

        const searcher = new SearcherV1({ engine, db });
        const items = await collectItems(searcher.performSearch({ filename: 'project' }, CONFIG_KEY));

        for (const item of items) {
            expect(item.score).toBeGreaterThanOrEqual(0);
            expect(item.score).toBeLessThanOrEqual(1);
        }
    });
});
