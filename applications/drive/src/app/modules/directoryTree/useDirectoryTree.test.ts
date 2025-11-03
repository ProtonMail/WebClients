import { act, renderHook } from '@testing-library/react-hooks';

import { NodeType, useDrive } from '@proton/drive';

import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { DirectoryTreeRootType } from './types';

jest.mock('@proton/drive');
const mockedUseDrive = jest.mocked(useDrive);

jest.mock('../../utils/errorHandling/useSdkErrorHandler');
const mockedHandleSdkError = jest.mocked(handleSdkError);

jest.mock('../../utils/errorHandling');
jest.mocked(sendErrorReport);

const { directoryTreeFactory } = jest.requireActual('./useDirectoryTree');

const createMockDevice = (rootFolderUid: string, name: string) => ({
    rootFolderUid,
    name: { ok: true, value: name },
});

const createMockNode = (uid: string, name: string, type: NodeType) => ({
    ok: true,
    value: { uid, name, type },
});

const createMockIterator = async function* <T>(items: T[]) {
    for (const item of items) {
        yield item;
    }
};

const MY_FILES_ROOT_UID = 'my-files-root-uid';

describe('useDirectoryTree', () => {
    const mockGetMyFilesRootFolder = jest.fn();
    const mockIterateDevices = jest.fn();
    const mockIterateSharedNodesWithMe = jest.fn();
    const mockIterateFolderChildren = jest.fn();

    const mockDrive = {
        getMyFilesRootFolder: mockGetMyFilesRootFolder,
        iterateDevices: mockIterateDevices,
        iterateSharedNodesWithMe: mockIterateSharedNodesWithMe,
        iterateFolderChildren: mockIterateFolderChildren,
    };

    const createMyFilesRoot = (uid = MY_FILES_ROOT_UID) => {
        mockGetMyFilesRootFolder.mockResolvedValue({
            ok: true,
            value: { uid, type: NodeType.Folder },
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseDrive.mockReturnValue({
            drive: mockDrive,
        } as unknown as ReturnType<typeof useDrive>);
    });

    describe('initializeTree', () => {
        it('should initialize tree with My files, Computers, and Shared with me roots', async () => {
            createMyFilesRoot();

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
            });

            const rootItems = result.current.rootItems;
            expect(rootItems).toHaveLength(3);

            // My files
            expect(rootItems[0]).toMatchObject({
                uid: MY_FILES_ROOT_UID,
                parentUid: null,
                name: 'My files',
                type: NodeType.Folder,
                expanded: false,
                expandable: true,
            });

            // Devices
            expect(rootItems[1]).toMatchObject({
                uid: 'devices-root',
                parentUid: null,
                name: 'Computers',
                type: DirectoryTreeRootType.PlaceholderRoot,
                expanded: false,
                expandable: true,
            });

            // Shared with me
            expect(rootItems[2]).toMatchObject({
                uid: 'shared-with-me-root',
                parentUid: null,
                name: 'Shared with me',
                type: DirectoryTreeRootType.PlaceholderRoot,
                expanded: false,
                expandable: true,
            });
        });

        it('should handle error when My files root cannot be loaded', async () => {
            mockGetMyFilesRootFolder.mockResolvedValue({
                ok: false,
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await expect(result.current.initializeTree()).rejects.toThrow('Cannot load "My files" root folder');
            });

            expect(mockedHandleSdkError).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('loadDevices', () => {
        it('should load devices from drive API', async () => {
            createMyFilesRoot();
            const devices = [createMockDevice('device-1', 'Device 1'), createMockDevice('device-2', 'Device 2')];

            mockIterateDevices.mockReturnValue(createMockIterator(devices));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand('devices-root');
            });

            const children = result.current.getChildrenOf('devices-root');
            expect(children).toHaveLength(2);
            expect(children[0].uid).toBe('device-1');
            expect(children[0].name).toBe('Device 1');
            expect(children[1].uid).toBe('device-2');
            expect(children[1].name).toBe('Device 2');
        });

        it('should skip devices without valid names', async () => {
            createMyFilesRoot();
            const devices = [createMockDevice('device-1', 'Device 1'), { uid: 'device-2', name: { ok: false } }];

            mockIterateDevices.mockReturnValue(createMockIterator(devices));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand('devices-root');
            });

            const children = result.current.getChildrenOf('devices-root');
            expect(children).toHaveLength(1);
            expect(children[0].uid).toBe('device-1');
        });

        it('should handle errors when loading devices', async () => {
            createMyFilesRoot();
            mockIterateDevices.mockImplementation(async function* () {
                throw new Error('Failed to load devices');
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await expect(result.current.toggleExpand('devices-root')).rejects.toThrow();
            });

            expect(mockedHandleSdkError).toHaveBeenCalledWith(expect.any(Error), {
                fallbackMessage: 'Failed to load devices',
            });
        });
    });

    describe('loadSharedWithMeRoots', () => {
        it('should load shared items from drive API', async () => {
            createMyFilesRoot();
            const sharedNodes = [
                createMockNode('shared-1', 'Shared Folder 1', NodeType.Folder),
                createMockNode('shared-2', 'Shared Folder 2', NodeType.Folder),
            ];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand('shared-with-me-root');
            });

            const children = result.current.getChildrenOf('shared-with-me-root');
            expect(children).toHaveLength(2);
            expect(children[0].uid).toBe('shared-1');
            expect(children[0].name).toBe('Shared Folder 1');
            expect(children[1].uid).toBe('shared-2');
            expect(children[1].name).toBe('Shared Folder 2');
        });

        it('should filter out non-folder items when onlyFolders option is true', async () => {
            createMyFilesRoot();
            const sharedNodes = [
                createMockNode('shared-1', 'Shared Folder', NodeType.Folder),
                createMockNode('shared-2', 'Shared File', NodeType.File),
            ];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore({ onlyFolders: true }));

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand('shared-with-me-root');
            });

            const children = result.current.getChildrenOf('shared-with-me-root');
            expect(children).toHaveLength(1);
            expect(children[0].uid).toBe('shared-1');
            expect(children[0].type).toBe(NodeType.Folder);
        });

        it('should skip failed shared nodes', async () => {
            createMyFilesRoot();
            const sharedNodes = [createMockNode('shared-1', 'Shared Folder 1', NodeType.Folder), { ok: false }];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand('shared-with-me-root');
            });

            const children = result.current.getChildrenOf('shared-with-me-root');
            expect(children).toHaveLength(1);
            expect(children[0].uid).toBe('shared-1');
        });

        it('should set expandable property correctly for folders and files', async () => {
            createMyFilesRoot();
            const sharedNodes = [
                createMockNode('shared-folder', 'Shared Folder', NodeType.Folder),
                createMockNode('shared-file', 'Shared File', NodeType.File),
            ];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand('shared-with-me-root');
            });

            const children = result.current.getChildrenOf('shared-with-me-root');
            expect(children).toHaveLength(2);

            // Folder should be expandable, file should not
            expect(children[0].expandable).toBe(true);
            expect(children[1].expandable).toBe(false);
        });

        it('should handle errors when loading shared items', async () => {
            createMyFilesRoot();
            mockIterateSharedNodesWithMe.mockImplementation(async function* () {
                throw new Error('Failed to load shared items');
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await expect(result.current.toggleExpand('shared-with-me-root')).rejects.toThrow();
            });

            expect(mockedHandleSdkError).toHaveBeenCalledWith(expect.any(Error), {
                fallbackMessage: 'Failed to load shared items',
            });
        });
    });

    describe('toggleExpand', () => {
        it('should collapse an already expanded item', async () => {
            createMyFilesRoot();

            const children = [createMockNode('child-1', 'Child 1', NodeType.Folder)];

            mockIterateFolderChildren.mockReturnValue(createMockIterator(children));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(MY_FILES_ROOT_UID);
            });

            // Check if the item is expanded
            const itemBeforeCollapse = result.current.rootItems.find((item: any) => item.uid === MY_FILES_ROOT_UID);
            expect(itemBeforeCollapse?.expanded).toBe(true);

            await act(async () => {
                await result.current.toggleExpand(MY_FILES_ROOT_UID);
            });

            // Check if the item is collapsed
            const itemAfterCollapse = result.current.rootItems.find((item: any) => item.uid === MY_FILES_ROOT_UID);
            expect(itemAfterCollapse?.expanded).toBe(false);
        });

        it('should throw error when toggling non-existent uid', async () => {
            createMyFilesRoot();

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
            });

            await act(async () => {
                await expect(result.current.toggleExpand('non-existent-uid')).rejects.toThrow(
                    'Expanding non-existent directory tree item'
                );
            });

            expect(mockIterateFolderChildren).not.toHaveBeenCalled();
        });

        it('should expand a collapsed item and load its children', async () => {
            createMyFilesRoot();

            const children = [
                createMockNode('child-1', 'Child 1', NodeType.Folder),
                createMockNode('child-2', 'Child 2', NodeType.File),
            ];

            mockIterateFolderChildren.mockReturnValue(createMockIterator(children));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(MY_FILES_ROOT_UID);
            });

            expect(mockIterateFolderChildren).toHaveBeenCalledWith(MY_FILES_ROOT_UID, undefined);

            // Verify the item is now marked as expanded
            const expandedItem = result.current.rootItems.find((item: any) => item.uid === MY_FILES_ROOT_UID);
            expect(expandedItem?.expanded).toBe(true);

            const childrenResult = result.current.getChildrenOf(MY_FILES_ROOT_UID);
            expect(childrenResult).toHaveLength(2);
            expect(childrenResult[0].uid).toBe('child-1');
            expect(childrenResult[1].uid).toBe('child-2');
        });

        it('should skip failed child nodes', async () => {
            createMyFilesRoot();

            const children = [createMockNode('child-1', 'Child 1', NodeType.Folder), { ok: false }];

            mockIterateFolderChildren.mockReturnValue(createMockIterator(children));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(MY_FILES_ROOT_UID);
            });

            const childrenResult = result.current.getChildrenOf(MY_FILES_ROOT_UID);
            expect(childrenResult).toHaveLength(1);
            expect(childrenResult[0].uid).toBe('child-1');
        });

        it('should set expandable correctly for child folders and files', async () => {
            createMyFilesRoot();

            const children = [
                createMockNode('child-folder', 'Child Folder', NodeType.Folder),
                createMockNode('child-file', 'Child File', NodeType.File),
            ];

            mockIterateFolderChildren.mockReturnValue(createMockIterator(children));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(MY_FILES_ROOT_UID);
            });

            const childrenResult = result.current.getChildrenOf(MY_FILES_ROOT_UID);
            expect(childrenResult).toHaveLength(2);

            // Folder should be expandable, file should not
            expect(childrenResult[0].expandable).toBe(true);
            expect(childrenResult[1].expandable).toBe(false);
        });

        it('should handle errors when loading folder children', async () => {
            createMyFilesRoot();

            mockIterateFolderChildren.mockImplementation(async function* () {
                throw new Error('Failed to load children');
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
            });

            await act(async () => {
                await expect(result.current.toggleExpand(MY_FILES_ROOT_UID)).rejects.toThrow('Failed to load children');
            });

            expect(mockedHandleSdkError).toHaveBeenCalledWith(expect.any(Error), {
                fallbackMessage: 'Failed to load folder children',
                extra: { uid: MY_FILES_ROOT_UID },
            });

            // Item should remain collapsed
            const item = result.current.rootItems.find((i: any) => i.uid === MY_FILES_ROOT_UID);
            expect(item?.expanded).toBe(false);
        });

        it('should throw error when expanding non-expandable item', async () => {
            createMyFilesRoot();

            const children = [createMockNode('child-file', 'Child File', NodeType.File)];

            mockIterateFolderChildren.mockReturnValue(createMockIterator(children));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(MY_FILES_ROOT_UID);
            });

            await act(async () => {
                await expect(result.current.toggleExpand('child-file')).rejects.toThrow(
                    'Expanding non-expandable directory tree item'
                );
            });

            // Verify the file remains unexpanded
            const file = result.current.getChildrenOf(MY_FILES_ROOT_UID)[0];
            expect(file.expanded).toBe(false);
        });
    });

    describe('getChildrenOf', () => {
        it('should return children of a given item', async () => {
            createMyFilesRoot();

            const children = [createMockNode('child-1', 'Child 1', NodeType.Folder)];

            mockIterateFolderChildren.mockReturnValue(createMockIterator(children));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(MY_FILES_ROOT_UID);
            });

            const childrenResult = result.current.getChildrenOf(MY_FILES_ROOT_UID);

            expect(childrenResult).toHaveLength(1);
            expect(childrenResult[0].uid).toBe('child-1');
        });

        it('should return empty array for non-existent uid', async () => {
            createMyFilesRoot();

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
            });

            const children = result.current.getChildrenOf('non-existent-uid');

            expect(children).toHaveLength(0);
        });
    });

    describe('directoryTreeFactory', () => {
        it('should create isolated store instances for each factory call', () => {
            const factory1 = directoryTreeFactory();
            const factory2 = directoryTreeFactory();

            expect(factory1).not.toBe(factory2);
        });

        it('should maintain separate state for different instances', async () => {
            createMyFilesRoot('root-1');

            const useDirectoryTreeWithStore1 = directoryTreeFactory();
            const useDirectoryTreeWithStore2 = directoryTreeFactory();

            const { result: result1 } = renderHook(() => useDirectoryTreeWithStore1());
            const { result: result2 } = renderHook(() => useDirectoryTreeWithStore2());

            await act(async () => {
                await result1.current.initializeTree();
            });

            // result1 should have items, result2 should not
            expect(result1.current.rootItems).toHaveLength(3);
            expect(result2.current.rootItems).toHaveLength(0);
        });
    });
});
