import 'fake-indexeddb/auto';
import { deleteDB, openDB } from 'idb';

import { esSentryReport } from '@proton/encrypted-search/esHelpers/esReporting';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { deleteContentSearchDB } from './delete';
import { openContentSearchDB } from './open';
import { getDBName } from './schema';

jest.mock('@proton/encrypted-search/esHelpers/esReporting', () => {
    return { esSentryReport: jest.fn() };
});
jest.mock('@proton/shared/lib/helpers/sentry', () => {
    return { ...jest.requireActual('@proton/shared/lib/helpers/sentry'), traceInitiativeError: jest.fn() };
});
jest.mock('idb', () => {
    const actual = jest.requireActual('idb');
    return { ...actual, deleteDB: jest.fn(actual.deleteDB) };
});

describe('deleteContentSearchDB', () => {
    beforeEach(() => {
        jest.mocked(esSentryReport).mockReset();
    });

    it('deletes the database without reporting when its connections close themselves', async () => {
        const db = await openContentSearchDB('closing-user');
        await db.put('config', 'enabled', 'status');

        await deleteContentSearchDB('closing-user');

        expect(esSentryReport).not.toHaveBeenCalled();
        const reopened = await openContentSearchDB('closing-user');
        try {
            expect(await reopened.get('config', 'status')).toBeUndefined();
        } finally {
            reopened.close();
        }
    });

    it('reports a connection that blocks the delete and waits for it to close', async () => {
        await openContentSearchDB('blocked-user').then((db) => {
            db.close();
        });
        // Like a tab running a build whose connections don't close themselves.
        const blocker = await openDB(getDBName('blocked-user'));
        const reported = new Promise<void>((resolve) => {
            jest.mocked(esSentryReport).mockImplementation(() => {
                resolve();
            });
        });
        let deleted = false;

        const deletion = deleteContentSearchDB('blocked-user').then(() => {
            deleted = true;
        });
        await reported;
        expect(deleted).toBe(false);
        blocker.close();
        await deletion;

        expect(esSentryReport).toHaveBeenCalledTimes(1);
        expect(deleted).toBe(true);
    });

    it('reports and rethrows a failed delete', async () => {
        const error = new Error('delete failed');
        jest.mocked(deleteDB).mockRejectedValueOnce(error);

        await expect(deleteContentSearchDB('failing-user')).rejects.toBe(error);

        expect(traceInitiativeError).toHaveBeenCalledWith(expect.anything(), error);
    });
});
