import { runSaga } from 'redux-saga';

import { ApiError } from '@proton/shared/lib/fetch/ApiError';

import { shareCreated, shareDeleted, shareUpdated } from '../../../store/actions/creators/share';
import type { ShareGetResponse, SyncEventShareOutput } from '../../../types/api/pass';
import type { PassCryptoWorker } from '../../../types/crypto/pass-crypto';
import type { ShareId } from '../../../types/crypto/pass-types';
import { createTestItem } from '../../../utils/tests/fixtures/items';
import { createShareRemovedError, createTestShare } from '../../../utils/tests/fixtures/shares';
import { sagaSetup } from '../../../utils/tests/saga';
import { exposePassCrypto } from '../../crypto';
import * as folderRequests from '../../folders/folders.requests';
import * as itemRequests from '../../items/item.requests';
import * as shareParser from '../../shares/share.parser';
import * as shareRequests from '../../shares/share.requests';
import type { EventProcessor } from '../types';
import { processSharesCreated, processSharesDeleted, processSharesUpdated } from './user-events.shares';

vi.mock('@proton/pass/lib/folders/folders.requests', async () => ({
    ...(await vi.importActual('@proton/pass/lib/folders/folders.requests')),
    requestFoldersForShareId: vi.fn(),
}));

vi.mock('@proton/pass/lib/items/item.requests', async () => ({
    ...(await vi.importActual('@proton/pass/lib/items/item.requests')),
    requestItemsForShareId: vi.fn(),
}));

vi.mock('@proton/pass/lib/shares/share.parser', async () => ({
    ...(await vi.importActual('@proton/pass/lib/shares/share.parser')),
    parseShareResponse: vi.fn(),
}));

vi.mock('@proton/pass/lib/shares/share.requests', async () => ({
    ...(await vi.importActual('@proton/pass/lib/shares/share.requests')),
    requestShare: vi.fn(),
}));

const requestShare = vi.mocked(shareRequests.requestShare);
const parseShareResponse = vi.mocked(shareParser.parseShareResponse);
const requestItemsForShareId = vi.mocked(itemRequests.requestItemsForShareId);
const requestFoldersForShareId = vi.mocked(folderRequests.requestFoldersForShareId);

const createEvent = (ShareID: ShareId) => ({ ShareID }) as SyncEventShareOutput;
const removeShare = vi.fn();
const canOpenShare = vi.fn(() => true);
const share = createTestShare({ shareId: 's1' });
const items = [createTestItem('login', { itemId: 'i1', shareId: 's1' })];
const folders = [{ folderId: 'f1', shareId: 's1', vaultId: 'v1', parentFolderId: null, name: 'Work', keyRotation: 1 }];

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
    requestFoldersForShareId.mockResolvedValue(folders);
    exposePassCrypto({ removeShare, canOpenShare } as unknown as PassCryptoWorker);
    removeShare.mockClear();
    canOpenShare.mockClear();
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('processSharesCreated', () => {
    test('fetches the share with its folders and items and dispatches `shareCreated`', async () => {
        const { result, dispatched } = await run(processSharesCreated, [createEvent('s1')]);
        expect(requestFoldersForShareId).toHaveBeenCalledWith('s1');
        expect(requestItemsForShareId).toHaveBeenCalledWith('s1', undefined);
        expect(result).toBe(true);
        expect(dispatched).toContainEqual(shareCreated({ share, items, folders }));
    });

    test('resolves folders before items so items inside folders can be decrypted', async () => {
        const order: string[] = [];
        requestFoldersForShareId.mockImplementation(async () => (order.push('folders'), folders));
        requestItemsForShareId.mockImplementation(async () => (order.push('items'), items));

        await run(processSharesCreated, [createEvent('s1')]);

        expect(order).toEqual(['folders', 'items']);
    });

    test('tolerates share-removed errors: returns `true` and skips dispatch', async () => {
        requestItemsForShareId.mockRejectedValueOnce(createShareRemovedError());
        const { result, dispatched } = await run(processSharesCreated, [createEvent('s1')]);
        expect(result).toBe(true);
        expect(dispatched).not.toContainEqual(shareCreated({ share, items, folders }));
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
