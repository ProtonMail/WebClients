import { runSaga } from 'redux-saga';

import { ApiError } from '@proton/shared/lib/fetch/ApiError';

import { shareCreated, shareDeleted, shareUpdated } from '../../../store/actions';
import { sagaSetup } from '../../../store/sagas/testing';
import type { PassCryptoWorker, ShareGetResponse, ShareId, SyncEventShareOutput } from '../../../types';
import { exposePassCrypto } from '../../crypto';
import * as itemRequests from '../../items/item.requests';
import { createTestItem } from '../../items/item.test.utils';
import * as shareParser from '../../shares/share.parser';
import * as shareRequests from '../../shares/share.requests';
import { createShareRemovedError, createTestShare } from '../../shares/share.test.utils';
import type { EventProcessor } from '../types';
import { processSharesCreated, processSharesDeleted, processSharesUpdated } from './user-events.shares';

jest.mock('@proton/pass/lib/items/item.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/items/item.requests'),
    requestItemsForShareId: jest.fn(),
}));

jest.mock('@proton/pass/lib/shares/share.parser', () => ({
    ...jest.requireActual('@proton/pass/lib/shares/share.parser'),
    parseShareResponse: jest.fn(),
}));

jest.mock('@proton/pass/lib/shares/share.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/shares/share.requests'),
    requestShare: jest.fn(),
}));

const requestShare = jest.mocked(shareRequests.requestShare);
const parseShareResponse = jest.mocked(shareParser.parseShareResponse);
const requestItemsForShareId = jest.mocked(itemRequests.requestItemsForShareId);

const createEvent = (ShareID: ShareId) => ({ ShareID }) as SyncEventShareOutput;
const removeShare = jest.fn();
const canOpenShare = jest.fn(() => true);
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
    exposePassCrypto({ removeShare, canOpenShare } as unknown as PassCryptoWorker);
    removeShare.mockClear();
    canOpenShare.mockClear();
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

    test('tolerates share-removed errors: returns `true` and skips dispatch', async () => {
        requestItemsForShareId.mockRejectedValueOnce(createShareRemovedError());
        const { result, dispatched } = await run(processSharesCreated, [createEvent('s1')]);
        expect(result).toBe(true);
        expect(dispatched).not.toContainEqual(shareCreated({ share, items }));
    });
});

describe('processSharesUpdated', () => {
    test('re-fetches the share and dispatches `shareUpdated`', async () => {
        const { result, dispatched } = await run(processSharesUpdated, [createEvent('s1')]);
        expect(requestShare).toHaveBeenCalledWith('s1');
        expect(result).toBe(true);
        expect(dispatched).toContainEqual(shareUpdated(share));
    });

    test('tolerates share-removed errors: returns `true` and skips dispatch', async () => {
        requestShare.mockRejectedValueOnce(createShareRemovedError());
        const { result, dispatched } = await run(processSharesUpdated, [createEvent('s1')]);
        expect(result).toBe(true);
        expect(dispatched).not.toContainEqual(shareUpdated(share));
    });

    test('returns `false` on a non-share-removed fetch error', async () => {
        requestShare.mockRejectedValueOnce(new ApiError('', 500, 'TestError'));
        const { result } = await run(processSharesUpdated, [createEvent('s1')]);
        expect(result).toBe(false);
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
