import { act, renderHook } from '@testing-library/react-hooks';

import { MemberRole, NodeType } from '@proton/drive';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { useCreateFolderModal } from '../CreateFolderModal';
import { useCopyItems } from './useCopyItems';
import { useCopyItemsModalState } from './useCopyItemsModalState';

// directoryTreeFactory() is called at module level in useCopyItemsModalState.
// We expose the inner mocks via private keys so tests can access and configure them.
jest.mock('../../modules/directoryTree', () => {
    const mockFns = {
        initializeTree: jest.fn().mockResolvedValue(undefined),
        get: jest.fn(),
        toggleExpand: jest.fn(),
        addNode: jest.fn(),
        treeRoots: [] as any[],
    };
    const mockHook = jest.fn(() => mockFns);
    return {
        directoryTreeFactory: jest.fn(() => mockHook),
        _mockFns: mockFns,
    };
});

jest.mock('./useCopyItems');
jest.mock('../../utils/errorHandling/useSdkErrorHandler');
jest.mock('../CreateFolderModal');

const mockedUseCopyItems = jest.mocked(useCopyItems);
const mockedUseSdkErrorHandler = jest.mocked(useSdkErrorHandler);
const mockedUseCreateFolderModal = jest.mocked(useCreateFolderModal);
const { _mockFns: mockTree } = jest.requireMock('../../modules/directoryTree');

const FOLDER_TREE_ID = 'null___folder-uid';
const FOLDER_UID = 'folder-uid';

const defaultProps = {
    itemsToCopy: [{ uid: 'item-1', name: 'File 1' }],
    onClose: jest.fn(),
    onExit: jest.fn(),
    open: true,
};

describe('useCopyItemsModalState', () => {
    const mockHandleError = jest.fn();
    const mockCopyItems = jest.fn().mockResolvedValue(undefined);
    const mockShowCreateFolderModal = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockTree.initializeTree.mockResolvedValue(undefined);
        mockTree.get.mockReturnValue(undefined);

        mockedUseCopyItems.mockReturnValue(mockCopyItems);
        mockedUseSdkErrorHandler.mockReturnValue({ handleError: mockHandleError });
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
        it('sets copyTargetTreeId for folders, ignores files', () => {
            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            act(() => {
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
        it('returns null for writable roles and a message for Viewer', () => {
            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            mockTree.get.mockReturnValue({ highestEffectiveRole: MemberRole.Editor });
            act(() => {
                result.current.handleSelect(FOLDER_TREE_ID, { type: NodeType.Folder } as any);
            });
            expect(result.current.errorMessage).toBeNull();

            mockTree.get.mockReturnValue({ highestEffectiveRole: MemberRole.Viewer });
            act(() => {
                result.current.handleSelect(FOLDER_TREE_ID, { type: NodeType.Folder } as any);
            });
            expect(result.current.errorMessage).toBeTruthy();
        });
    });

    describe('onCopy', () => {
        it('does nothing when no target is selected', () => {
            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            act(() => {
                result.current.onCopy();
            });

            expect(mockCopyItems).not.toHaveBeenCalled();
        });

        it('calls copyItems and closes modal on success', async () => {
            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            act(() => {
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

            act(() => {
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
        it('opens the create folder modal and calls addNode on success', () => {
            const { result } = renderHook(() => useCopyItemsModalState(defaultProps));

            // Split into two acts so copyTargetUid is committed before onCreateFolder closes over it.
            act(() => {
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
