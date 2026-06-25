import { runSaga } from 'redux-saga';

import { exposePassCrypto } from '@proton/pass/lib/crypto';
import * as itemRequests from '@proton/pass/lib/items/item.requests';
import { createTestItem } from '@proton/pass/lib/items/item.test.utils';
import * as shareParser from '@proton/pass/lib/shares/share.parser';
import * as shareRequests from '@proton/pass/lib/shares/share.requests';
import { createTestShare } from '@proton/pass/lib/shares/share.test.utils';
import type { EventProcessor } from '@proton/pass/lib/sync/types';
import { shareCreated, shareDeleted, shareUpdated } from '@proton/pass/store/actions';
import { sagaSetup } from '@proton/pass/store/sagas/testing';
import type { PassCryptoWorker, ShareGetResponse, ShareId, SyncEventShareOutput } from '@proton/pass/types';

import { processSharesCreated, processSharesDeleted, processSharesUpdated } from './user-events.shares';

const requestShare = jest.spyOn(shareRequests, 'requestShare');
const parseShareResponse = jest.spyOn(shareParser, 'parseShareResponse');
const requestItemsForShareId = jest.spyOn(itemRequests, 'requestItemsForShareId');

const createEvent = (ShareID: ShareId) => ({ ShareID }) as SyncEventShareOutput;
const removeShare = jest.fn();
const share = createTestShare({ shareId: 's1' });
const items = [createTestItem('login', { itemId: 'i1', shareId: 's1' })];

const run = async (
    saga: (events: SyncEventShareOutput[]) => EventProcessor,
    events: SyncEventShareOutput[],
    state?: unknown
) => {
    const setup = sagaSetup(state);
    const result = await runSaga(setup.options, saga, events).toPromise<boolean>();
    return { result, dispatched: setup.dispatched };
};

beforeEach(() => {
    requestShare.mockResolvedValue({} as ShareGetResponse);
    parseShareResponse.mockResolvedValue(share);
    requestItemsForShareId.mockResolvedValue(items);
    exposePassCrypto({ removeShare } as unknown as PassCryptoWorker);
    removeShare.mockClear();
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('processSharesCreated', () => {
    test('fetches the share with its items and dispatches `shareCreated`', async () => {
        const { result, dispatched } = await run(processSharesCreated, [createEvent('s1')]);
        expect(requestItemsForShareId).toHaveBeenCalledWith('s1');
        expect(result).toBe(true);
        expect(dispatched).toContainEqual(shareCreated({ share, items }));
    });
});

describe('processSharesUpdated', () => {
    test('re-fetches the share and dispatches `shareUpdated`', async () => {
        const { result, dispatched } = await run(processSharesUpdated, [createEvent('s1')]);
        expect(requestShare).toHaveBeenCalledWith('s1');
        expect(result).toBe(true);
        expect(dispatched).toContainEqual(shareUpdated(share));
    });
});

describe('processSharesDeleted', () => {
    test('cleans up crypto state and dispatches `shareDeleted` for known shares', async () => {
        const { result, dispatched } = await run(processSharesDeleted, [createEvent('s1')], { shares: { s1: share } });
        expect(result).toBe(true);
        expect(removeShare).toHaveBeenCalledWith('s1');
        expect(dispatched).toContainEqual(shareDeleted(share));
    });
});
