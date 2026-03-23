import { act, renderHook, waitFor } from '@testing-library/react';

import { generateNodeUid } from '@proton/drive';

import { directoryTreeFactory } from '../../modules/directoryTree';
import { makeTreeItemId } from '../../modules/directoryTree/helpers';
import { sendErrorReport } from '../../utils/errorHandling';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { createMockNodeEntity } from '../../utils/test/nodeEntity';
import { useMoveItemsModalState } from './useMoveItemsModalState';

const mockInitializeTree = jest.fn();
const mockToggleExpand = jest.fn();
const mockAddNode = jest.fn();
const mockClear = jest.fn();
const mockCreateNotification = jest.fn();
const mockMoveNodes = jest.fn();
const mockShowCreateFolderModal = jest.fn();
const mockIterateNodes = jest.fn();
const mockOnClose = jest.fn();
const mockOnExit = jest.fn();

jest.mock('../../modules/directoryTree', () => ({
    directoryTreeFactory: jest.fn(() =>
        jest.fn(() => ({
            initializeTree: mockInitializeTree,
            toggleExpand: mockToggleExpand,
            treeRoots: [],
            addNode: mockAddNode,
            clear: mockClear,
        }))
    ),
}));

jest.mock('../../utils/sdk/getNodeAncestry', () => ({
    getNodeAncestry: jest.fn(),
}));

jest.mock('../../utils/errorHandling', () => ({
    sendErrorReport: jest.fn(),
    handleSdkError: jest.fn(),
}));

jest.mock('@proton/components', () => ({
    useNotifications: jest.fn(() => ({ createNotification: mockCreateNotification })),
}));

jest.mock('../../hooks/sdk/useMoveNodes', () => ({
    useMoveNodes: jest.fn(() => ({ moveNodes: mockMoveNodes, isLoading: false })),
}));

jest.mock('../CreateFolderModal', () => ({
    useCreateFolderModal: jest.fn(() => ({
        createFolderModal: null,
        showCreateFolderModal: mockShowCreateFolderModal,
    })),
}));

jest.mock('@proton/drive', () => {
    let driveInstance: { iterateNodes: jest.Mock };
    return {
        ...jest.requireActual('@proton/drive'),
        getDrive: jest.fn(() => {
            if (!driveInstance) {
                driveInstance = { iterateNodes: mockIterateNodes };
            }
            return driveInstance;
        }),
    };
});

const mockGetNodeAncestry = getNodeAncestry as jest.MockedFunction<typeof getNodeAncestry>;
const mockSendErrorReport = sendErrorReport as jest.MockedFunction<typeof sendErrorReport>;

const ROOT_UID = generateNodeUid('vol1', 'root');
const NODE1_UID = generateNodeUid('vol1', 'node1');
const FOLDER1_UID = generateNodeUid('vol1', 'folder1');

async function* makeAsyncIterable<T>(items: T[]): AsyncIterable<T> {
    for (const item of items) {
        yield item;
    }
}

/**
 * Builds a mock ancestry result where the first element is the root.
 */
const createMockAncestry = (rootUid: string, ...leafUids: string[]) => ({
    ok: true as const,
    value: [
        { ok: true as const, value: createMockNodeEntity({ uid: rootUid, parentUid: undefined }) },
        ...leafUids.map((uid) => ({ ok: true as const, value: createMockNodeEntity({ uid }) })),
    ],
});

const defaultProps = {
    nodeUids: [NODE1_UID],
    onClose: mockOnClose,
    onExit: mockOnExit,
    open: true,
};

const defaultNode = createMockNodeEntity({
    uid: NODE1_UID,
    parentUid: ROOT_UID,
    name: 'file1.txt',
});

const makeFolderItem = (treeItemId: string) => ({
    nodeUid: FOLDER1_UID,
    treeItemId,
    name: 'My Folder',
    expandable: true,
    children: null,
    type: 'folder',
});

type LoadedResult = { current: Extract<ReturnType<typeof useMoveItemsModalState>, { loaded: true }> };

function assertLoaded(result: { current: ReturnType<typeof useMoveItemsModalState> }): asserts result is LoadedResult {
    if (!result.current.loaded) {
        throw new Error('Expected loaded state');
    }
}

/** Renders the hook and waits until loaded, returning a narrowed result. */
async function renderLoaded(props = defaultProps) {
    const rendered = renderHook(() => useMoveItemsModalState(props));
    await waitFor(() => expect(rendered.result.current.loaded).toBe(true));
    assertLoaded(rendered.result);
    return rendered as typeof rendered & { result: LoadedResult };
}

// Capture the inner hook mock returned by directoryTreeFactory() at module load time,
// before clearAllMocks wipes the factory's recorded results.
const mockUseDirectoryTree = (directoryTreeFactory as jest.Mock).mock.results[0].value as jest.Mock;

describe('useMoveItemsModalState', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockGetNodeAncestry.mockResolvedValue(createMockAncestry(ROOT_UID, NODE1_UID));
        mockInitializeTree.mockResolvedValue(undefined);
        mockIterateNodes.mockImplementation(() => makeAsyncIterable([{ ok: true, value: defaultNode }]));
        mockMoveNodes.mockResolvedValue(undefined);
        mockAddNode.mockResolvedValue(undefined);
        mockToggleExpand.mockResolvedValue(undefined);
    });

    describe('loading state', () => {
        it('returns loaded: false on initial render', async () => {
            // Prevent ancestry resolution from settling before we inspect
            mockGetNodeAncestry.mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useMoveItemsModalState(defaultProps));

            expect(result.current.loaded).toBe(false);

            // Wait for fetchNodes microtask and avoid react warnings.
            await act(async () => {});
        });

        it('returns loaded: false while initializeTree is pending', async () => {
            let resolveInit!: () => void;
            mockInitializeTree.mockReturnValue(new Promise<void>((res) => (resolveInit = res)));

            const { result } = renderHook(() => useMoveItemsModalState(defaultProps));

            await waitFor(() => expect(mockInitializeTree).toHaveBeenCalled());
            expect(result.current.loaded).toBe(false);

            // Wait for microtasks and avoid react warnings.
            await act(async () => {
                resolveInit();
            });
        });
    });

    describe('loaded state', () => {
        it('returns loaded: true with nodes once all async work completes', async () => {
            const { result } = await renderLoaded();

            expect(result.current.nodes).toHaveLength(1);
            expect(result.current.nodes[0].uid).toBe(NODE1_UID);
            expect(result.current.treeRoots).toBeDefined();
        });

        it('initializes the directory tree after the scope root uid is resolved', async () => {
            renderHook(() => useMoveItemsModalState(defaultProps));

            await waitFor(() => expect(mockInitializeTree).toHaveBeenCalledTimes(1));
        });
    });

    describe('resolveTreeScopeRootUid', () => {
        it('resolves the common root when multiple nodes share the same root', async () => {
            const NODE2_UID = generateNodeUid('vol1', 'node2');

            mockGetNodeAncestry.mockImplementation((nodeUid) =>
                Promise.resolve(createMockAncestry(ROOT_UID, nodeUid as string))
            );
            mockIterateNodes.mockImplementation(() =>
                makeAsyncIterable([
                    {
                        ok: true,
                        value: createMockNodeEntity({ uid: NODE1_UID, parentUid: ROOT_UID, name: 'file1.txt' }),
                    },
                    {
                        ok: true,
                        value: createMockNodeEntity({ uid: NODE2_UID, parentUid: ROOT_UID, name: 'file2.txt' }),
                    },
                ])
            );

            const { result } = await renderLoaded({ ...defaultProps, nodeUids: [NODE1_UID, NODE2_UID] });

            expect(result.current.nodes).toHaveLength(2);
            expect(mockInitializeTree).toHaveBeenCalledTimes(1);

            // Verify the resolved root UID was passed to the directory tree hook
            expect(mockUseDirectoryTree).toHaveBeenCalledWith(
                'moveItemsModal',
                expect.objectContaining({
                    treeRootsStrategy: { type: 'FROM_NODE', rootNodeUid: ROOT_UID },
                })
            );
        });

        it('shows an error and closes when nodes belong to different roots', async () => {
            const ROOT2_UID = generateNodeUid('vol2', 'root');
            const NODE2_UID = generateNodeUid('vol2', 'node2');

            mockGetNodeAncestry
                .mockResolvedValueOnce(createMockAncestry(ROOT_UID, NODE1_UID))
                .mockResolvedValueOnce(createMockAncestry(ROOT2_UID, NODE2_UID));

            renderHook(() => useMoveItemsModalState({ ...defaultProps, nodeUids: [NODE1_UID, NODE2_UID] }));

            await waitFor(() => {
                expect(mockSendErrorReport).toHaveBeenCalled();
                expect(mockOnClose).toHaveBeenCalled();
            });
        });

        it('shows an error and closes when nodeUids is empty', async () => {
            renderHook(() => useMoveItemsModalState({ ...defaultProps, nodeUids: [] }));

            await waitFor(() => {
                expect(mockSendErrorReport).toHaveBeenCalled();
                expect(mockOnClose).toHaveBeenCalled();
            });
        });
    });

    describe('handleSelect', () => {
        it('sets the move target when selecting a folder', async () => {
            const { result } = await renderLoaded();

            const treeItemId = makeTreeItemId(ROOT_UID, FOLDER1_UID);

            act(() => {
                result.current.handleSelect(treeItemId, makeFolderItem(treeItemId));
            });

            expect(result.current.moveTargetTreeId).toBe(treeItemId);
            expect(result.current.moveTargetUid).toBe(FOLDER1_UID);
        });
    });

    describe('onClose', () => {
        it('calls onClose and clears the directory tree store', async () => {
            const { result } = await renderLoaded();

            act(() => {
                result.current.onClose();
            });

            expect(mockOnClose).toHaveBeenCalledTimes(1);
            expect(mockClear).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleSubmit', () => {
        it('calls moveNodes then closes', async () => {
            const { result } = await renderLoaded();

            const treeItemId = makeTreeItemId(ROOT_UID, FOLDER1_UID);
            act(() => {
                result.current.handleSelect(treeItemId, makeFolderItem(treeItemId));
            });

            await act(async () => {
                await result.current.handleSubmit();
            });

            expect(mockMoveNodes).toHaveBeenCalledWith(
                { [NODE1_UID]: { name: 'file1.txt', parentUid: ROOT_UID } },
                FOLDER1_UID
            );
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    describe('createFolder', () => {
        it('uses the selected folder as parent by default', async () => {
            const { result } = await renderLoaded();

            const treeItemId = makeTreeItemId(ROOT_UID, FOLDER1_UID);
            act(() => {
                result.current.handleSelect(treeItemId, makeFolderItem(treeItemId));
            });

            act(() => {
                void result.current.createFolder();
            });

            expect(mockShowCreateFolderModal).toHaveBeenCalledWith(
                expect.objectContaining({ parentFolderUid: FOLDER1_UID })
            );
        });

        it('uses the scope root as parent when no folder is selected', async () => {
            const { result } = await renderLoaded();

            act(() => {
                void result.current.createFolder();
            });

            expect(mockShowCreateFolderModal).toHaveBeenCalledWith(
                expect.objectContaining({ parentFolderUid: ROOT_UID })
            );
        });

        it('calls addNode, toggleExpand, and selects the new folder in onSuccess', async () => {
            const { result } = await renderLoaded();

            // Select a folder so moveTargetTreeId is set
            const treeItemId = makeTreeItemId(ROOT_UID, FOLDER1_UID);
            act(() => {
                result.current.handleSelect(treeItemId, makeFolderItem(treeItemId));
            });

            act(() => {
                void result.current.createFolder();
            });

            // Extract the onSuccess callback passed to showCreateFolderModal
            const { onSuccess } = mockShowCreateFolderModal.mock.calls[0][0];

            const NEW_FOLDER_UID = 'new-folder-uid';
            await act(async () => {
                await onSuccess({ uid: NEW_FOLDER_UID, parentUid: FOLDER1_UID, name: 'New Folder' });
            });

            expect(mockAddNode).toHaveBeenCalledWith(NEW_FOLDER_UID, FOLDER1_UID, 'New Folder');
            expect(mockToggleExpand).toHaveBeenCalledWith(treeItemId);
            expect(result.current.moveTargetTreeId).toBe(makeTreeItemId(FOLDER1_UID, NEW_FOLDER_UID));
        });
    });
});
