import { MemberRole, NodeType } from '@protontech/drive-sdk';
import { act, renderHook } from '@testing-library/react';

import { handleSdkError } from '../../../legacy/errorHandling';
import { useCreateFolderModal } from '../../createFolderModal';
import { useCopyItems } from './useCopyItems';
import { useCopyItemsModalState } from './useCopyItemsModalState';

const mockTree = vi.hoisted(() => ({
    initializeTree: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    toggleExpand: vi.fn(),
    addNode: vi.fn(),
    treeRoots: [] as any[],
}));

// directoryTreeFactory() is called at module level in useCopyItemsModalState.
// The inner mocks are hoisted so tests can access and configure them.
vi.mock('@proton/drive/modules/directoryTree', async () => {
    const mockHook = vi.fn(() => mockTree);
    return {
        ...(await vi.importActual('@proton/drive/modules/directoryTree')),
        directoryTreeFactory: vi.fn(() => mockHook),
    };
});

vi.mock('./useCopyItems');
vi.mock('@proton/drive/legacy/errorHandling');
vi.mock('@proton/drive/modals/createFolderModal');

const mockedUseCopyItems = vi.mocked(useCopyItems);
const mockedUseCreateFolderModal = vi.mocked(useCreateFolderModal);

const FOLDER_TREE_ID = 'null___folder-uid';
const FOLDER_UID = 'folder-uid';

const defaultProps = {
    itemsToCopy: [{ uid: 'item-1', name: 'File 1', type: NodeType.File }],
    onClose: vi.fn(),
    onExit: vi.fn(),
    open: true,
};

describe('useCopyItemsModalState', () => {
    const mockHandleError = vi.mocked(handleSdkError);
    const mockCopyItems = vi.fn().mockResolvedValue(undefined);
    const mockShowCreateFolderModal = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        mockTree.initializeTree.mockResolvedValue(undefined);
        mockTree.get.mockReturnValue(undefined);

        mockedUseCopyItems.mockReturnValue(mockCopyItems);
        mockedUseCreateFolderModal.mockReturnValue({
            createFolderModal: null as any,
            showCreateFolderModal: mockShowCreateFolderModal,
        });
    });

    it('starts with isLoading=true and sets it to false after tree initializes', async () => {
        const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.isLoading).toBe(false);
        expect(mockTree.initializeTree).toHaveBeenCalledTimes(1);
    });

    it('calls handleError when initialization fails', async () => {
        const error = new Error('Init failed');
        mockTree.initializeTree.mockRejectedValue(error);

        renderHook(() => useCopyItemsModalState(defaultProps));

        await act(async () => {});

        expect(mockHandleError).toHaveBeenCalledWith(error);
    });

    describe('handleSelect', () => {
        it('sets copyTargetTreeId for folders, ignores files', async () => {
            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            await act(async () => {
                result.current.handleSelect('null___file-uid', { type: NodeType.File } as any);
            });
            expect(result.current.copyTargetTreeId).toBeUndefined();

            act(() => {
                result.current.handleSelect(FOLDER_TREE_ID, { type: NodeType.Folder } as any);
            });
            expect(result.current.copyTargetTreeId).toBe(FOLDER_TREE_ID);
            expect(result.current.copyTargetUid).toBe(FOLDER_UID);
        });
    });

    describe('errorMessage', () => {
        it('returns null for writable roles and a message for Viewer', async () => {
            const { result, rerender } = renderHook(() => useCopyItemsModalState(defaultProps));

            mockTree.get.mockReturnValue({ highestEffectiveRole: MemberRole.Editor });
            await act(async () => {
                result.current.handleSelect(FOLDER_TREE_ID, { type: NodeType.Folder } as any);
            });
            expect(result.current.errorMessage).toBeNull();

            mockTree.get.mockReturnValue({ highestEffectiveRole: MemberRole.Viewer });
            act(() => {
                result.current.handleSelect(FOLDER_TREE_ID, { type: NodeType.Folder } as any);
            });
            // Selecting the same folder does not re-render: the role is read from the tree during render
            rerender();
            expect(result.current.errorMessage).toBeTruthy();
        });
    });

    describe('onCopy', () => {
        it('does nothing when no target is selected', async () => {
            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            await act(async () => {
                result.current.onCopy();
            });

            expect(mockCopyItems).not.toHaveBeenCalled();
        });

        it('calls copyItems and closes modal on success', async () => {
            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            await act(async () => {
                result.current.handleSelect(FOLDER_TREE_ID, { type: NodeType.Folder } as any);
            });

            await act(async () => {
                result.current.onCopy();
            });

            expect(mockCopyItems).toHaveBeenCalledWith(defaultProps.itemsToCopy, FOLDER_UID);
            expect(defaultProps.onClose).toHaveBeenCalled();
        });

        it('calls handleError on failure', async () => {
            const error = new Error('Copy failed');
            mockCopyItems.mockRejectedValue(error);

            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            await act(async () => {
                result.current.handleSelect(FOLDER_TREE_ID, { type: NodeType.Folder } as any);
            });

            await act(async () => {
                result.current.onCopy();
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, expect.objectContaining({ extra: expect.any(Object) }));
            expect(defaultProps.onClose).not.toHaveBeenCalled();
        });
    });

    describe('onCreateFolder', () => {
        it('opens the create folder modal and calls addNode on success', async () => {
            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            // Split into two acts so copyTargetUid is committed before onCreateFolder closes over it.
            await act(async () => {
                result.current.handleSelect(FOLDER_TREE_ID, { type: NodeType.Folder } as any);
            });
            act(() => {
                result.current.onCreateFolder();
            });

            expect(mockShowCreateFolderModal).toHaveBeenCalledWith(
                expect.objectContaining({ parentFolderUid: FOLDER_UID })
            );

            const { onSuccess } = mockShowCreateFolderModal.mock.calls[0][0];
            act(() => {
                onSuccess({ uid: 'new-uid', name: 'New Folder' });
            });

            expect(mockTree.addNode).toHaveBeenCalledWith('new-uid', FOLDER_UID, 'New Folder');
        });
    });
});
