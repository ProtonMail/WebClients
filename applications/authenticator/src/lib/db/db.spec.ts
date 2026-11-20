import type { Mock } from 'vitest';

import { db as appDB, setupDB } from './db';
import * as encryption from './middlewares/encryption';
import * as dbMigrations from './migrations';
import * as utils from './utils';

const db = appDB as unknown as any;

vi.mock('dexie', () => ({
    __esModule: true,
    default: class MockDexie {
        use: Mock;
        verno: number;
        constructor() {
            this.use = vi.fn();
            this.verno = 4;
        }
    },
}));

vi.mock('../storage-key/service', () => ({
    createStorageKeyService: vi.fn(() => ({ read: vi.fn() })),
}));

vi.mock('./middlewares/encryption');
vi.mock('./migrations');
vi.mock('./utils');

const createEncryptionMiddleware = encryption.createEncryptionMiddleware as Mock;
const getCurrentDBVersion = utils.getCurrentDBVersion as Mock;
const openDB = utils.openDB as Mock;
const closeDB = utils.closeDB as Mock;
const migrations = dbMigrations.default as Mock;
const mockMiddleware = Symbol('middleware');

describe('setupDB', () => {
    beforeEach(() => {
        getCurrentDBVersion.mockResolvedValue(4);
        openDB.mockResolvedValue(undefined);
        closeDB.mockResolvedValue(undefined);
        migrations.mockImplementation(() => {});
        createEncryptionMiddleware.mockImplementation(() => mockMiddleware);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('configures encryption middleware', async () => {
        getCurrentDBVersion.mockResolvedValue(4);
        db.verno = 4;
        await setupDB();

        expect(createEncryptionMiddleware).toHaveBeenCalled();
        expect(db.use).toHaveBeenCalledWith({
            stack: 'dbcore',
            name: 'encryption',
            level: 0,
            create: mockMiddleware,
        });
    });

    test('sets up DB without migration step when version >= 4', async () => {
        getCurrentDBVersion.mockResolvedValue(4);
        db.verno = 4;
        await setupDB();

        /** single/final DB open operation if migrated */
        expect(migrations).toHaveBeenCalledWith(db);
        expect(openDB).toHaveBeenCalledTimes(1);
        expect(closeDB).not.toHaveBeenCalled();
    });

    test('sets up DB without migration step when version is null (first install)', async () => {
        getCurrentDBVersion.mockResolvedValue(null);
        db.verno = 4;
        await setupDB();

        expect(migrations).toHaveBeenCalledWith(db);
        expect(openDB).toHaveBeenCalledTimes(1);
        expect(closeDB).not.toHaveBeenCalled();
    });

    test('runs migration when version < 4 (app update)', async () => {
        getCurrentDBVersion.mockResolvedValue(3);
        db.verno = 4;
        await setupDB();

        /** open/close for migration + final open */
        expect(migrations).toHaveBeenCalledWith(db);
        expect(openDB).toHaveBeenCalledTimes(2);
        expect(closeDB).toHaveBeenCalledTimes(1);
    });

    test('throws error when final version < 4', async () => {
        getCurrentDBVersion.mockResolvedValue(3);
        db.verno = 3; /** simulates migration failure */
        await expect(setupDB()).rejects.toThrow();
    });
});
