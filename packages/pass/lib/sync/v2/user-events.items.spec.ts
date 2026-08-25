import { runSaga } from 'redux-saga';

import { ApiError } from '@proton/shared/lib/fetch/ApiError';

import { itemsDeleteEvent, itemsUpdated } from '../../../store/actions';
import { sagaSetup } from '../../../store/sagas/testing';
import type { ItemId, ShareId, SyncEventShareItemOutput } from '../../../types';
import * as itemRequests from '../../items/item.requests';
import { createTestItem } from '../../items/item.test.utils';
import type { EventProcessor } from '../types';
import { processItemsDeleted, processItemsUpdated } from './user-events.items';

jest.mock('@proton/pass/lib/items/item.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/items/item.requests'),
    requestItem: jest.fn(),
}));

const requestItem = jest.mocked(itemRequests.requestItem);
const createEvent = (ShareID: ShareId, ItemID: ItemId) => ({ ShareID, ItemID }) as SyncEventShareItemOutput;
const item = createTestItem('login', { itemId: 'i1', shareId: 's1' });

const run = async (
    saga: (events: SyncEventShareItemOutput[]) => EventProcessor,
    events: SyncEventShareItemOutput[]
) => {
    const setup = sagaSetup();
    const result = await runSaga(setup.options, saga, events).toPromise<boolean>();
    return { result, dispatched: setup.dispatched };
};

describe('processItemsUpdated', () => {
    afterEach(() => jest.clearAllMocks());

    test('returns `true` without dispatching for an empty batch', async () => {
        const { result, dispatched } = await run(processItemsUpdated, []);
        expect(result).toBe(true);
        expect(dispatched).toHaveLength(0);
    });

    test('fetches/parses each item and dispatches `itemsUpdated`', async () => {
        requestItem.mockResolvedValue(item);
        const { result, dispatched } = await run(processItemsUpdated, [createEvent('s1', 'i1')]);
        expect(requestItem).toHaveBeenCalledWith('s1', 'i1');
        expect(result).toBe(true);
        expect(dispatched).toContainEqual(itemsUpdated([item]));
    });

    test('returns `false` when an item cannot be fetched', async () => {
        requestItem.mockResolvedValueOnce(item).mockRejectedValueOnce(new ApiError('', 500, 'TestError'));
        const events = [createEvent('s1', 'i1'), createEvent('s1', 'i2')];
        const { result, dispatched } = await run(processItemsUpdated, events);
        expect(result).toBe(false);
        expect(dispatched).toContainEqual(itemsUpdated([item]));
    });

    test('returns `true` and skips dispatch when an item resolves `undefined` (removed share / undecryptable)', async () => {
        requestItem.mockResolvedValue(undefined);
        const { result, dispatched } = await run(processItemsUpdated, [createEvent('s1', 'i1')]);
        expect(result).toBe(true);
        expect(dispatched).toHaveLength(0);
    });
});

describe('processItemsDeleted', () => {
    test('returns `true` without dispatching for an empty batch', async () => {
        const { result, dispatched } = await run(processItemsDeleted, []);
        expect(result).toBe(true);
        expect(dispatched).toHaveLength(0);
    });

    test('dispatches `itemsDeleteEvent` grouped by share', async () => {
        const events = [createEvent('s1', 'i1'), createEvent('s1', 'i2'), createEvent('s2', 'i3')];
        const { result, dispatched } = await run(processItemsDeleted, events);
        expect(result).toBe(true);
        expect(dispatched).toContainEqual(itemsDeleteEvent('s1', ['i1', 'i2']));
        expect(dispatched).toContainEqual(itemsDeleteEvent('s2', ['i3']));
    });
});
