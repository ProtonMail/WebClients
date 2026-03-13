import { EngineOrchestrator } from '.';
import type { OrchestratorSearchItem } from '.';
import type { ActiveMainThreadBridgeService } from '../ActiveMainThreadBridgeService';
import { Logger } from '../Logger';
import { Engine } from '../engine/Engine';
import type { EngineSearchItem } from '../engine/core/searcher/BaseSearcher';
import { EngineDB } from '../engine/storage/EngineDB';
import { EngineType, SdkType } from '../types';
import type { UserId } from '../types';

jest.mock('../Logger', () => ({
    Logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// BroadcastChannel is not available in Jest.
jest.mock('../searchModuleStateUpdateChannel', () => ({
    createSearchModuleStateUpdateChannel: () => ({ postMessage: jest.fn(), close: jest.fn() }),
}));

// Prevent Jest from loading Engine.ts (which imports the ESM-only WASM library).
jest.mock('../engine/Engine', () => ({
    Engine: { create: jest.fn() },
}));

// Prevent Jest from loading EngineDB.ts (idb uses IndexedDB APIs unavailable in Jest).
jest.mock('../engine/storage/EngineDB', () => ({
    EngineDB: { open: jest.fn() },
}));

const USER_1 = 'user-1' as UserId;

function makeBridgeService(): ActiveMainThreadBridgeService {
    return {} as ActiveMainThreadBridgeService;
}

async function* toAsyncGenerator(items: EngineSearchItem[]): AsyncGenerator<EngineSearchItem> {
    for (const item of items) {
        yield item;
    }
}

function makeMockEngine(items: EngineSearchItem[] = []) {
    return {
        getState: jest.fn().mockReturnValue({ isInitialIndexing: false, isSearchable: false }),
        onStateChange: jest.fn().mockReturnValue(() => {}),
        startIndexing: jest.fn().mockResolvedValue(undefined),
        stopIndexing: jest.fn(),
        search: jest.fn().mockReturnValue(toAsyncGenerator(items)),
    };
}

/** Collect all items from an async generator into an array. */
async function collectItems(gen: AsyncGenerator<OrchestratorSearchItem>): Promise<OrchestratorSearchItem[]> {
    const items: OrchestratorSearchItem[] = [];
    for await (const item of gen) {
        items.push(item);
    }
    return items;
}

describe('EngineOrchestrator', () => {
    let mockEngine: ReturnType<typeof makeMockEngine>;

    beforeEach(() => {
        mockEngine = makeMockEngine();
        jest.mocked(Engine.create).mockResolvedValue(mockEngine as any);
        jest.mocked(EngineDB.open).mockResolvedValue({} as EngineDB);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addEngine()', () => {
        it('opens an EngineDB with the correct userId and engineType', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });

            expect(jest.mocked(EngineDB.open)).toHaveBeenCalledWith(USER_1, EngineType.MY_FILES);
        });

        it('creates an Engine with the correct configKey, db, and bridgeService', async () => {
            const bridgeService = makeBridgeService();
            const db = {} as EngineDB;
            jest.mocked(EngineDB.open).mockResolvedValue(db);

            const orchestrator = new EngineOrchestrator(USER_1, bridgeService);
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });

            expect(jest.mocked(Engine.create)).toHaveBeenCalledWith({ configKey: 'v1', db, bridgeService });
        });

        it('does not call startIndexing() — caller must call start() explicitly', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });

            expect(mockEngine.startIndexing).not.toHaveBeenCalled();
        });

        it('is a no-op when called again with the same configKey', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());

            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });

            expect(jest.mocked(Engine.create)).toHaveBeenCalledTimes(1);
        });

        it('logs a warning when the same configKey is already registered', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });

            expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('already exists'));
        });

        it('propagates errors thrown by EngineDB.open()', async () => {
            jest.mocked(EngineDB.open).mockRejectedValue(new Error('IDB open failed'));
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());

            await expect(
                orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE })
            ).rejects.toThrow('IDB open failed');
        });

        it('propagates errors thrown by Engine.create()', async () => {
            jest.mocked(Engine.create).mockRejectedValue(new Error('WASM init failed'));
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());

            await expect(
                orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE })
            ).rejects.toThrow('WASM init failed');
        });
    });

    describe('start()', () => {
        it('calls startIndexing() on every registered engine', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });

            orchestrator.start();

            expect(mockEngine.startIndexing).toHaveBeenCalledTimes(1);
        });

        it('does nothing when no engines are registered', () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            expect(() => orchestrator.start()).not.toThrow();
        });
    });

    describe('stop()', () => {
        it('does nothing when no engines are registered', () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            expect(() => orchestrator.stop()).not.toThrow();
        });

        it('calls stopIndexing() on every registered engine', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });

            orchestrator.stop();

            expect(mockEngine.stopIndexing).toHaveBeenCalledTimes(1);
        });

        it('can be called multiple times without throwing', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });

            expect(() => {
                orchestrator.stop();
                orchestrator.stop();
            }).not.toThrow();
        });
    });

    describe('search()', () => {
        it('yields no items when no engines are registered', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());

            const items = await collectItems(orchestrator.search({ filename: 'test' }));

            expect(items).toEqual([]);
        });

        it('yields results from a single engine with engineType and sdkType', async () => {
            const engine = makeMockEngine([
                { nodeUid: 'uid-111', score: 0.9 },
                { nodeUid: 'uid-222', score: 0.5 },
            ]);
            jest.mocked(Engine.create).mockResolvedValue(engine as any);

            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine({ engineType: EngineType.MY_FILES, configKey: 'v1', sdkType: SdkType.DRIVE });

            const items = await collectItems(orchestrator.search({ filename: 'test' }));

            expect(items).toEqual([
                { nodeUid: 'uid-111', score: 0.9, engineType: 'MY_FILES', sdkType: SdkType.DRIVE },
                { nodeUid: 'uid-222', score: 0.5, engineType: 'MY_FILES', sdkType: SdkType.DRIVE },
            ]);
        });

        it('yields results from multiple engines', async () => {
            const engineA = makeMockEngine([
                { nodeUid: 'uid-111', score: 0.8 },
                { nodeUid: 'uid-222', score: 0.3 },
            ]);
            const engineB = makeMockEngine([
                { nodeUid: 'uid-111', score: 0.5 },
                { nodeUid: 'uid-333', score: 0.9 },
            ]);
            jest.mocked(Engine.create)
                .mockResolvedValueOnce(engineA as any)
                .mockResolvedValueOnce(engineB as any);

            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine({ engineType: 'engine-a' as EngineType, configKey: 'v1', sdkType: SdkType.DRIVE });
            await orchestrator.addEngine({ engineType: 'engine-b' as EngineType, configKey: 'testConfig', sdkType: SdkType.PHOTOS });

            const items = await collectItems(orchestrator.search({ filename: 'test' }));
            const nodeUids = items.map((i) => i.nodeUid);

            // All items from both engines are yielded
            expect(nodeUids).toContain('uid-111');
            expect(nodeUids).toContain('uid-222');
            expect(nodeUids).toContain('uid-333');
        });

        it('yields results from healthy engines when one engine fails', async () => {
            const healthyEngine = makeMockEngine([{ nodeUid: 'uid-111', score: 0.7 }]);

            const failingEngine = makeMockEngine();
            failingEngine.search.mockImplementation(async function* () {
                throw new Error('engine broke');
            });

            jest.mocked(Engine.create)
                .mockResolvedValueOnce(healthyEngine as any)
                .mockResolvedValueOnce(failingEngine as any);

            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine({ engineType: 'healthy' as EngineType, configKey: 'v1', sdkType: SdkType.DRIVE });
            await orchestrator.addEngine({ engineType: 'failing' as EngineType, configKey: 'testConfig', sdkType: SdkType.DRIVE });

            const items = await collectItems(orchestrator.search({ filename: 'test' }));

            expect(items).toEqual([
                { nodeUid: 'uid-111', score: 0.7, engineType: 'healthy' as EngineType, sdkType: SdkType.DRIVE },
            ]);
            expect(Logger.error).toHaveBeenCalledWith('EngineOrchestrator: engine search failed', expect.any(Error));
        });
    });
});
