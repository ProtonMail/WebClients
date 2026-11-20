import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';

import { openContentSearchDB } from './open';
import { getDBName } from './schema';

describe('openContentSearchDB', () => {
    it('closes an open connection instead of blocking a delete of the database', async () => {
        const db = await openContentSearchDB('blocking-user');
        await db.put('config', 'enabled', 'status');
        const blocked = vi.fn();

        // Without the fix, this never resolves and the test times out.
        await deleteDB(getDBName('blocking-user'), { blocked });

        expect(blocked).not.toHaveBeenCalled();
        await expect(db.get('config', 'status')).rejects.toThrow();
        const reopened = await openContentSearchDB('blocking-user');
        try {
            expect(await reopened.get('config', 'status')).toBeUndefined();
        } finally {
            reopened.close();
        }
    });

    it('tells the holder when another connection closes it', async () => {
        const onClosed = vi.fn();
        await openContentSearchDB('closed-user', onClosed);

        await deleteDB(getDBName('closed-user'));

        expect(onClosed).toHaveBeenCalledTimes(1);
    });
});
