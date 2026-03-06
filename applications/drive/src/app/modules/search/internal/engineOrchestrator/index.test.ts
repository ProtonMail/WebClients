import { EngineOrchestrator } from '.';
import { Logger } from '../Logger';
import type { MainThreadBridgeService } from '../MainThreadBridgeService';
import { Engine } from '../engine/Engine';
import { EngineDB } from '../engine/storage/EngineDB';
import type { UserId } from '../types';

jest.mock('../Logger', () => ({
    Logger: { info: jest.fn(), warn: jest.fn() },
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

function makeBridgeService(): MainThreadBridgeService {
    return {} as MainThreadBridgeService;
}

function makeMockEngine() {
    return {
        startIndexing: jest.fn().mockResolvedValue(undefined),
        stopIndexing: jest.fn(),
    };
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
        it('opens an EngineDB with the correct userId and engineLabel', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine('DEFAULT', 'v1');

            expect(jest.mocked(EngineDB.open)).toHaveBeenCalledWith(USER_1, 'DEFAULT');
        });

        it('creates an Engine with the correct configKey, db, and bridgeService', async () => {
            const bridgeService = makeBridgeService();
            const db = {} as EngineDB;
            jest.mocked(EngineDB.open).mockResolvedValue(db);

            const orchestrator = new EngineOrchestrator(USER_1, bridgeService);
            await orchestrator.addEngine('DEFAULT', 'v1');

            expect(jest.mocked(Engine.create)).toHaveBeenCalledWith({ configKey: 'v1', db, bridgeService });
        });

        it('does not call startIndexing() — caller must call start() explicitly', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine('DEFAULT', 'v1');

            expect(mockEngine.startIndexing).not.toHaveBeenCalled();
        });

        it('is a no-op when called again with the same configKey', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());

            await orchestrator.addEngine('DEFAULT', 'v1');
            await orchestrator.addEngine('DEFAULT', 'v1');

            expect(jest.mocked(Engine.create)).toHaveBeenCalledTimes(1);
        });

        it('logs a warning when the same configKey is already registered', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine('DEFAULT', 'v1');
            await orchestrator.addEngine('DEFAULT', 'v1');

            expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('already exists'));
        });

        it('propagates errors thrown by EngineDB.open()', async () => {
            jest.mocked(EngineDB.open).mockRejectedValue(new Error('IDB open failed'));
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());

            await expect(orchestrator.addEngine('DEFAULT', 'v1')).rejects.toThrow('IDB open failed');
        });

        it('propagates errors thrown by Engine.create()', async () => {
            jest.mocked(Engine.create).mockRejectedValue(new Error('WASM init failed'));
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());

            await expect(orchestrator.addEngine('DEFAULT', 'v1')).rejects.toThrow('WASM init failed');
        });
    });

    describe('start()', () => {
        it('calls startIndexing() on every registered engine', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine('DEFAULT', 'v1');

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
            await orchestrator.addEngine('DEFAULT', 'v1');

            orchestrator.stop();

            expect(mockEngine.stopIndexing).toHaveBeenCalledTimes(1);
        });

        it('can be called multiple times without throwing', async () => {
            const orchestrator = new EngineOrchestrator(USER_1, makeBridgeService());
            await orchestrator.addEngine('DEFAULT', 'v1');

            expect(() => {
                orchestrator.stop();
                orchestrator.stop();
            }).not.toThrow();
        });
    });
});
