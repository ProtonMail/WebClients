import { detectStorageCapabilities } from '@proton/shared/lib/helpers/browser';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { canLoadRunner } from './shouldLoadMigrationWorker';

vi.mock('@proton/encrypted-search/esIDB/indexedDB', () => ({
    hasESDB: vi.fn(),
    openESDB: vi.fn(),
}));
vi.mock('./contentVersionHelpers', () => ({ isAllContentUpToDate: vi.fn() }));
vi.mock('@proton/shared/lib/helpers/browser', () => ({
    detectStorageCapabilities: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/sentry', () => ({
    SentryMailInitiatives: { MIGRATION_TOOL: 'migration-tool' },
    traceInitiativeError: vi.fn(),
}));

const mockDetect = vi.mocked(detectStorageCapabilities);

describe('canLoadRunner', () => {
    const originalWorker = global.Worker;

    beforeEach(() => {
        vi.clearAllMocks();
        (global as any).Worker = vi.fn();
    });

    afterAll(() => {
        global.Worker = originalWorker;
    });

    it('returns false without reporting when IndexedDB is not accessible', async () => {
        mockDetect.mockResolvedValue({ hasIndexedDB: true, isAccessible: false });
        expect(await canLoadRunner()).toBe(false);
        expect(traceInitiativeError).not.toHaveBeenCalled();
    });

    it('returns false when IndexedDB is missing', async () => {
        mockDetect.mockResolvedValue({ hasIndexedDB: false, isAccessible: false });
        expect(await canLoadRunner()).toBe(false);
        expect(traceInitiativeError).not.toHaveBeenCalled();
    });

    it('returns true when IndexedDB is available and accessible', async () => {
        mockDetect.mockResolvedValue({ hasIndexedDB: true, isAccessible: true });
        expect(await canLoadRunner()).toBe(true);
    });
});
