import { runSaga } from 'redux-saga';

import type { Address, User } from '@proton/shared/lib/interfaces';

import { exposePassCrypto } from '../../../../lib/crypto';
import type { PassCryptoWorker } from '../../../../types';
import { uniqueId } from '../../../../utils/string/unique-id';
import { syncIntent } from '../../../actions';
import { sagaSetup } from '../../testing';
import { onUserRefreshed } from './channel.core';

describe('`onUserRefreshed`', () => {
    const UserKeys = [
        { ID: 'key1', Active: 1 },
        { ID: 'key2', Active: 1 },
        { ID: 'key3', Active: 0 },
    ];

    const user: User = { Keys: UserKeys } as unknown as User;
    const addresses: Address[] = [{ ID: 'addr1' }, { ID: 'addr2' }] as Address[];
    const PassCrypto = { getContext: jest.fn(), hydrate: jest.fn() };
    const keyPassword = uniqueId();

    beforeEach(() => {
        exposePassCrypto(PassCrypto as unknown as PassCryptoWorker);
        jest.clearAllMocks();
    });

    test('should return early if no `keyPassword` provided', async () => {
        const saga = sagaSetup();
        const task = runSaga(saga.options, onUserRefreshed, user);
        await task.toPromise();

        expect(saga.dispatched).toHaveLength(0);
        expect(PassCrypto.getContext).not.toHaveBeenCalled();
    });

    test('should trigger full sync when user keys are updated', async () => {
        /** Missing local userKeys */
        PassCrypto.getContext.mockReturnValue({ userKeys: [{ ID: 'key1' }], addresses });

        const saga = sagaSetup({ user: { addresses } });
        const task = runSaga(saga.options, onUserRefreshed, user, keyPassword);
        await task.toPromise();

        expect(PassCrypto.hydrate).toHaveBeenCalledWith({ user, keyPassword, addresses, clear: false });
        expect(saga.dispatched).toContainEqual(syncIntent());
    });

    test('should not trigger full sync when keys are unchanged', async () => {
        /** All active keys already present */
        PassCrypto.getContext.mockReturnValue({ userKeys: [{ ID: 'key1' }, { ID: 'key2' }], addresses });

        const saga = sagaSetup({ user: { addresses } });
        const task = runSaga(saga.options, onUserRefreshed, user, keyPassword);
        await task.toPromise();

        expect(PassCrypto.hydrate).toHaveBeenCalledWith({ user, keyPassword, addresses, clear: false });
        expect(saga.dispatched).not.toContainEqual(syncIntent());
    });

    test('should handle crypto hydration errors gracefully', async () => {
        PassCrypto.getContext.mockReturnValue({ userKeys: [{ ID: 'key1' }], addresses });
        PassCrypto.hydrate.mockRejectedValue(new Error('Hydration failed'));

        const saga = sagaSetup({ user: { addresses } });
        const task = runSaga(saga.options, onUserRefreshed, user, keyPassword);
        await task.toPromise();

        expect(saga.dispatched).toHaveLength(0);
    });
});
