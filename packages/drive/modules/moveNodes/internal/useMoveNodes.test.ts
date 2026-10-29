import { act, renderHook } from '@testing-library/react';

import { handleSdkError } from '../../../legacy/errorHandling';
import { BusDriverEventName } from '../../../modules/busDriver';
import { generateNodeUid } from '../../../sdk';
import { useMoveNodes } from './useMoveNodes';

const mockDriveMoveNodes = jest.fn();
const mockEmit = jest.fn();
const mockCreateMovedItemsNotifications = jest.fn();

jest.mock('../../../sdk', () => ({
    ...jest.requireActual('../../../sdk'),
    useDrive: jest.fn(() => ({ drive: { moveNodes: mockDriveMoveNodes } })),
    getDrive: jest.fn(() => ({})),
}));

jest.mock('../../../modules/busDriver', () => ({
    ...jest.requireActual('../../../modules/busDriver'),
    getBusDriver: jest.fn(() => ({ emit: mockEmit })),
}));

jest.mock('./useMovedItemsNotification', () => ({
    useMovedItemsNotification: jest.fn(() => ({
        createMovedItemsNotifications: mockCreateMovedItemsNotifications,
    })),
}));

jest.mock('../../../legacy/errorHandling', () => ({
    handleSdkError: jest.fn(),
}));

const NODE1_UID = generateNodeUid('vol1', 'node1');
const NODE2_UID = generateNodeUid('vol1', 'node2');
const PARENT_UID = generateNodeUid('vol1', 'parent');
const TARGET_UID = generateNodeUid('vol1', 'target');

const itemMap = {
    [NODE1_UID]: { name: 'a.txt', parentUid: PARENT_UID },
    [NODE2_UID]: { name: 'b.txt', parentUid: PARENT_UID },
};

async function* makeAsyncIterable<T>(items: T[]): AsyncIterable<T> {
    for (const item of items) {
        yield item;
    }
}

describe('useMoveNodes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockEmit.mockResolvedValue(undefined);
    });

    it('returns which items moved and which failed', async () => {
        const error = new Error('Name conflict');
        mockDriveMoveNodes.mockImplementation(() =>
            makeAsyncIterable([
                { uid: NODE1_UID, ok: true },
                { uid: NODE2_UID, ok: false, error },
            ])
        );
        const { result } = renderHook(() => useMoveNodes());

        let moveResult;
        await act(async () => {
            moveResult = await result.current.moveNodes(itemMap, TARGET_UID);
        });

        expect(moveResult).toEqual({
            movedUids: [NODE1_UID],
            failedItems: [{ uid: NODE2_UID, error }],
            targetFolderUid: TARGET_UID,
        });
    });

    it('only emits and offers undo for the moved items on partial failure', async () => {
        const error = new Error('Name conflict');
        mockDriveMoveNodes.mockImplementation(() =>
            makeAsyncIterable([
                { uid: NODE1_UID, ok: true },
                { uid: NODE2_UID, ok: false, error },
            ])
        );
        const { result } = renderHook(() => useMoveNodes());

        await act(async () => {
            await result.current.moveNodes(itemMap, TARGET_UID);
        });

        expect(mockCreateMovedItemsNotifications).toHaveBeenCalledWith(
            [{ uid: NODE1_UID, name: 'a.txt' }],
            [{ uid: NODE2_UID, error }],
            expect.any(Function)
        );
        expect(mockEmit).toHaveBeenCalledWith(
            { type: BusDriverEventName.MOVED_NODES, items: [{ uid: NODE1_UID, parentUid: TARGET_UID }] },
            expect.anything()
        );

        const undo = mockCreateMovedItemsNotifications.mock.calls[0][2];
        mockDriveMoveNodes.mockImplementation(() => makeAsyncIterable([{ uid: NODE1_UID, ok: true }]));
        await act(async () => {
            await undo();
        });

        expect(mockDriveMoveNodes).toHaveBeenLastCalledWith([NODE1_UID], PARENT_UID);
    });

    it('reports and rethrows when the SDK move fails', async () => {
        const error = new Error('Network error');
        mockDriveMoveNodes.mockImplementation(async function* () {
            yield { uid: NODE1_UID, ok: true };
            throw error;
        });
        const { result } = renderHook(() => useMoveNodes());

        await act(async () => {
            await expect(result.current.moveNodes(itemMap, TARGET_UID)).rejects.toThrow(error);
        });

        expect(handleSdkError).toHaveBeenCalledWith(error, {
            extra: { itemsUId: [NODE1_UID, NODE2_UID], targetFolderUid: TARGET_UID },
        });
        expect(mockCreateMovedItemsNotifications).not.toHaveBeenCalled();
        expect(mockEmit).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });
});
