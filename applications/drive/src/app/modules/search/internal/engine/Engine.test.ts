import 'fake-indexeddb/auto';

import { InvalidSearcherConfig, InvalidSearcherState } from '../errors';
import { Engine } from './Engine';
import { SearcherV1 } from './configs/v1/searcher/SearcherV1';
import { EngineDB } from './storage/EngineDB';
import { setupRealSearchLibraryWasm } from './testing/setupRealSearchLibraryWasm';

setupRealSearchLibraryWasm();

jest.mock('./core/indexer/IndexWriter', () => ({ IndexWriter: jest.fn() }));
jest.mock('./core/indexer/IndexerStateMachine', () => ({
    IndexerState: { BULK_UPDATE: 'BULK_UPDATE' },
    IndexerStateMachine: jest.fn(() => ({ onStateChange: jest.fn() })),
}));
jest.mock('../Logger', () => ({
    Logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

async function createEngine(db: EngineDB): Promise<Engine> {
    return Engine.create({ configKey: 'v1', db, bridgeService: {} as any });
}

/** Consume an async generator to force execution and collect results. */
async function consumeGenerator<T>(gen: AsyncGenerator<T>): Promise<T[]> {
    const items: T[] = [];
    for await (const item of gen) {
        items.push(item);
    }
    return items;
}

beforeEach(() => {
    indexedDB = new IDBFactory();
});

describe('Engine.search()', () => {
    it('throws InvalidSearcherState when no active config key is set', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        const engine = await createEngine(db);

        await expect(consumeGenerator(engine.search({ filename: 'test' }))).rejects.toThrow(InvalidSearcherState);
    });

    it('throws InvalidSearcherConfig when active config key is not in the registry', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        await db.setEngineState({ activeConfigKey: 'unknown-config' });
        const engine = await createEngine(db);

        await expect(consumeGenerator(engine.search({ filename: 'test' }))).rejects.toThrow(InvalidSearcherConfig);
    });

    it('uses the Searcher from the current active config, even after a config switch', async () => {
        const db = await EngineDB.open('user1', 'engine1');
        await db.setEngineState({ activeConfigKey: 'v1' });
        const engine = await createEngine(db);

        const emptyGenerator = async function* (): AsyncGenerator<never> {
            // no results
        };
        const performSearchSpy = jest.spyOn(SearcherV1.prototype, 'performSearch').mockReturnValue(
            emptyGenerator()
        );

        // First search: active config is v1
        await consumeGenerator(engine.search({ filename: 'first' }));

        expect(performSearchSpy).toHaveBeenCalledTimes(1);
        expect(performSearchSpy).toHaveBeenLastCalledWith({ filename: 'first' }, 'v1');

        // Simulate the indexer switching to a new config
        await db.setEngineState({ activeConfigKey: 'testConfig' });

        // Second search: should now pick up testConfig's config key
        await consumeGenerator(engine.search({ filename: 'second' }));

        expect(performSearchSpy).toHaveBeenCalledTimes(2);
        expect(performSearchSpy).toHaveBeenLastCalledWith({ filename: 'second' }, 'testConfig');

        performSearchSpy.mockRestore();
    });
});
