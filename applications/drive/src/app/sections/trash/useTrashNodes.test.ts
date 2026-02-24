import { act, renderHook } from '@testing-library/react';

import { type NodeEntity, useDrive } from '@proton/drive/index';
import { getNodeEntityFromMaybeNode } from '@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode';

import { useTrashStore } from './useTrash.store';
import { useTrashNodes } from './useTrashNodes';

jest.mock('@proton/drive/index', () => ({
    useDrive: jest.fn(),
}));

jest.mock('../../utils/errorHandling/handleSdkError');

jest.mock('@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode', () => ({
    getNodeEntityFromMaybeNode: jest.fn(),
}));

jest.mock('./useTrash.store', () => {
    const hook = jest.fn() as jest.Mock & { getState: jest.Mock };
    hook.getState = jest.fn();
    return { useTrashStore: hook };
});

const mockUseDrive = jest.mocked(useDrive);
const mockGetNodeEntityFromMaybeNode = jest.mocked(getNodeEntityFromMaybeNode);
const mockUseTrashStore = useTrashStore as jest.MockedFunction<typeof useTrashStore> & { getState: jest.Mock };

const createNode = (uid: string, name: string): NodeEntity =>
    ({
        uid,
        name,
    }) as unknown as NodeEntity;

const createAsyncIterable = <T>(items: T[]) =>
    (async function* () {
        for (const item of items) {
            yield item;
        }
    })();

describe('useTrashNodes', () => {
    const setNodes = jest.fn();
    const setLoading = jest.fn();
    const iterateTrashedNodes = jest.fn();
    const handleError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseTrashStore.mockImplementation((selector: (state: any) => any) =>
            selector({ setNodes, trashNodes: {}, isLoading: false })
        );
        mockUseTrashStore.getState.mockReturnValue({ setLoading, isLoading: false, setNodes });

        mockUseDrive.mockReturnValue({
            drive: {
                iterateTrashedNodes,
            },
        } as any);

        mockGetNodeEntityFromMaybeNode.mockImplementation((trashNode: any) => ({
            node: trashNode.node,
            errors: new Map(),
        }));
    });

    it('loads trashed drive nodes and updates the store', async () => {
        iterateTrashedNodes.mockReturnValue(
            createAsyncIterable([
                { node: createNode('drive-1', 'Drive 1') },
                { node: createNode('drive-2', 'Drive 2') },
            ])
        );

        const { result } = renderHook(() => useTrashNodes());
        const abortController = new AbortController();

        await act(async () => {
            await result.current.loadTrashNodes(abortController.signal);
        });

        expect(iterateTrashedNodes).toHaveBeenCalledWith(abortController.signal);
        expect(setLoading).toHaveBeenNthCalledWith(1, true);
        expect(setLoading).toHaveBeenLastCalledWith(false);
        expect(setNodes).toHaveBeenCalledTimes(2);
        expect(setNodes).toHaveBeenCalledWith({ 'drive-1': { uid: 'drive-1', name: 'Drive 1' } });
        expect(setNodes).toHaveBeenCalledWith({ 'drive-2': { uid: 'drive-2', name: 'Drive 2' } });
        expect(handleError).not.toHaveBeenCalled();
    });

    it('skips loading when trash nodes are already being loaded', async () => {
        mockUseTrashStore.getState.mockReturnValue({ setLoading, isLoading: true, setNodes });

        const { result } = renderHook(() => useTrashNodes());

        await act(async () => {
            await result.current.loadTrashNodes(new AbortController().signal);
        });

        expect(iterateTrashedNodes).not.toHaveBeenCalled();
        expect(setLoading).not.toHaveBeenCalled();
        expect(setNodes).not.toHaveBeenCalled();
    });
});
