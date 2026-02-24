import { act, renderHook } from '@testing-library/react-hooks';

import { MemberRole, NodeType, useDrive } from '@proton/drive';

import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { DEVICES_ROOT_ID, SHARED_WITH_ME_ROOT_ID, makeTreeItemId } from './helpers';
import { DirectoryTreeRootType } from './types';

jest.mock('@proton/drive');
const mockedUseDrive = jest.mocked(useDrive);

jest.mock('../../utils/errorHandling/handleSdkError');
const mockedHandleSdkError = jest.mocked(handleSdkError);

jest.mock('../../utils/errorHandling');
jest.mocked(sendErrorReport);

jest.mock('@proton/drive/internal/BusDriver', () => ({
    ...jest.requireActual('@proton/drive/internal/BusDriver'),
    getBusDriver: jest.fn(),
}));

const { directoryTreeFactory } = jest.requireActual('./useDirectoryTree');

const createMockDevice = (rootFolderUid: string, name: string) => ({
    rootFolderUid,
    name: { ok: true, value: name },
});

const createMockNode = (uid: string, name: string, type: NodeType) => ({
    ok: true,
    value: { uid, name, type, directRole: MemberRole.Viewer, isShared: false },
});

const createMockIterator = async function* <T>(items: T[]) {
    for (const item of items) {
        yield item;
    }
};

const MY_FILES_ROOT_UID = 'my-files-root-uid';

// Helper function to find a tree item in the array structure
const findTreeItem = (treeRoots: any[], nodeUid: string): any => {
    return treeRoots.find((item) => item.nodeUid === nodeUid);
};

describe('useDirectoryTree', () => {
    const mockGetMyFilesRootFolder = jest.fn();
    const mockIterateDevices = jest.fn();
    const mockIterateSharedNodesWithMe = jest.fn();
    const mockIterateFolderChildren = jest.fn();
    const mockGetNode = jest.fn();

    const mockDrive = {
        getMyFilesRootFolder: mockGetMyFilesRootFolder,
        iterateDevices: mockIterateDevices,
        iterateSharedNodesWithMe: mockIterateSharedNodesWithMe,
        iterateFolderChildren: mockIterateFolderChildren,
        getNode: mockGetNode,
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

            expect(result.current.treeRoots).toHaveLength(3);

            const myFilesRoot = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFilesRoot).toMatchObject({
                parentUid: null,
                name: 'My files',
                type: 'files-root',
                expandable: true,
                children: null,
            });

            const devicesRoot = findTreeItem(result.current.treeRoots, DEVICES_ROOT_ID);
            expect(devicesRoot).toMatchObject({
                parentUid: null,
                name: 'Computers',
                type: DirectoryTreeRootType.DevicesRoot,
                expandable: true,
                children: null,
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(sharedRoot).toMatchObject({
                parentUid: null,
                name: 'Shared with me',
                type: DirectoryTreeRootType.SharesRoot,
                expandable: true,
                children: null,
            });
        });

        it('should handle degraded My files root node', async () => {
            mockGetMyFilesRootFolder.mockResolvedValue({
                ok: false,
                error: {
                    uid: 'degraded-root-uid',
                    type: NodeType.Folder,
                    name: { ok: true, value: 'My files' },
                },
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
            });

            expect(result.current.treeRoots).toHaveLength(3);
            const degradedRoot = findTreeItem(result.current.treeRoots, 'degraded-root-uid');
            expect(degradedRoot).toMatchObject({
                parentUid: null,
                name: 'My files',
                type: 'files-root',
            });
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
                await result.current.toggleExpand(makeTreeItemId(null, DEVICES_ROOT_ID));
            });

            const devicesRoot = findTreeItem(result.current.treeRoots, DEVICES_ROOT_ID);
            expect(devicesRoot.children).not.toBeNull();
            expect(Object.keys(devicesRoot.children)).toHaveLength(2);
            expect(devicesRoot.children['device-1'].name).toBe('Device 1');
            expect(devicesRoot.children['device-2'].name).toBe('Device 2');
        });

        it('should handle devices without valid names gracefully', async () => {
            createMyFilesRoot();
            const mockError = new Error('Device name unavailable');
            const devices = [
                createMockDevice('device-1', 'Device 1'),
                { rootFolderUid: 'device-2', name: { ok: false, error: mockError } },
            ];

            mockIterateDevices.mockReturnValue(createMockIterator(devices));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, DEVICES_ROOT_ID));
            });

            const devicesRoot = findTreeItem(result.current.treeRoots, DEVICES_ROOT_ID);
            expect(devicesRoot.children).not.toBeNull();
            expect(devicesRoot.children['device-1'].name).toBe('Device 1');
            expect(devicesRoot.children['device-2'].name).toBe('⚠️ Undecryptable device');
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
                await expect(result.current.toggleExpand(makeTreeItemId(null, DEVICES_ROOT_ID))).rejects.toThrow();
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
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(sharedRoot.children).not.toBeNull();
            expect(Object.keys(sharedRoot.children)).toHaveLength(2);
            expect(sharedRoot.children['shared-1'].name).toBe('Shared Folder 1');
            expect(sharedRoot.children['shared-2'].name).toBe('Shared Folder 2');
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
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(sharedRoot.children).not.toBeNull();
            expect(Object.keys(sharedRoot.children)).toHaveLength(1);
            expect(sharedRoot.children['shared-1'].type).toBe(NodeType.Folder);
        });

        it('should handle degraded shared nodes gracefully', async () => {
            createMyFilesRoot();
            const sharedNodes = [
                createMockNode('shared-1', 'Shared Folder 1', NodeType.Folder),
                {
                    ok: false,
                    error: {
                        uid: 'degraded-shared',
                        type: NodeType.Folder,
                        name: { ok: true, value: 'Degraded Name' },
                    },
                },
            ];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(sharedRoot.children).not.toBeNull();
            expect(Object.keys(sharedRoot.children)).toHaveLength(2);
            expect(sharedRoot.children['shared-1']).toBeDefined();
            expect(sharedRoot.children['degraded-shared'].name).toBe('Degraded Name');
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
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(sharedRoot.children).not.toBeNull();
            expect(sharedRoot.children['shared-folder'].expandable).toBe(true);
            expect(sharedRoot.children['shared-file'].expandable).toBe(false);
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
                await expect(
                    result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID))
                ).rejects.toThrow();
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
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            // Check if the item is expanded
            let myFilesRoot = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFilesRoot.children).not.toBeNull();

            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            // Check if the item is collapsed
            myFilesRoot = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFilesRoot.children).toBeNull();
        });

        it('should throw error when toggling with invalid treeItemId', async () => {
            createMyFilesRoot();

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
            });

            await act(async () => {
                // Invalid treeItemId will extract uid and throw error if item doesn't exist
                await expect(result.current.toggleExpand('some-parent___non-existent-uid')).rejects.toThrow(
                    'Failed to expand folder'
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
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            expect(mockIterateFolderChildren).toHaveBeenCalledWith(MY_FILES_ROOT_UID, undefined, expect.any(Object));

            const myFiles = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFiles.children).not.toBeNull();
            expect(myFiles.children['child-1']).toBeDefined();
            expect(myFiles.children['child-2']).toBeDefined();
        });

        it('should handle degraded child nodes gracefully', async () => {
            createMyFilesRoot();

            const children = [
                createMockNode('child-1', 'Child 1', NodeType.Folder),
                {
                    ok: false,
                    error: {
                        uid: 'degraded-child',
                        type: NodeType.File,
                        name: { ok: true, value: 'Degraded File' },
                    },
                },
            ];

            mockIterateFolderChildren.mockReturnValue(createMockIterator(children));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            const myFiles = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFiles.children).not.toBeNull();
            expect(myFiles.children['child-1']).toBeDefined();
            expect(myFiles.children['degraded-child'].name).toBe('Degraded File');
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
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            const myFiles = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFiles.children).not.toBeNull();
            expect(myFiles.children['child-folder'].expandable).toBe(true);
            expect(myFiles.children['child-file'].expandable).toBe(false);
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
                await expect(result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID))).rejects.toThrow(
                    'Failed to load children'
                );
            });

            expect(mockedHandleSdkError).toHaveBeenCalledWith(expect.any(Error), {
                fallbackMessage: 'Failed to expand folder',
                extra: { uid: MY_FILES_ROOT_UID },
            });

            // Item should remain collapsed
            const myFilesRoot = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFilesRoot.children).toBeNull();
        });

        it('should throw error when expanding non-expandable item', async () => {
            createMyFilesRoot();

            const children = [createMockNode('child-file', 'Child File', NodeType.File)];

            mockIterateFolderChildren.mockReturnValue(createMockIterator(children));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            await act(async () => {
                await expect(
                    result.current.toggleExpand(makeTreeItemId(MY_FILES_ROOT_UID, 'child-file'))
                ).rejects.toThrow('Failed to expand folder');
            });
        });

        it('should abort loading devices list when collapsing', async () => {
            createMyFilesRoot();

            let abortSignalReceived: AbortSignal | undefined;
            mockIterateDevices.mockImplementation(async function* (signal: AbortSignal) {
                abortSignalReceived = signal;
                yield createMockDevice('device-1', 'Device 1');
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, DEVICES_ROOT_ID));
            });

            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(null, DEVICES_ROOT_ID));
            });

            expect(abortSignalReceived?.aborted).toBe(true);
        });

        it('should abort loading shared with me when collapsing', async () => {
            createMyFilesRoot();

            let abortSignalReceived: AbortSignal | undefined;
            mockIterateSharedNodesWithMe.mockImplementation(async function* (signal: AbortSignal) {
                abortSignalReceived = signal;
                yield createMockNode('shared-1', 'Shared 1', NodeType.Folder);
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            expect(abortSignalReceived?.aborted).toBe(true);
        });

        it('should abort loading my files when collapsing', async () => {
            createMyFilesRoot();

            let abortSignalReceived: AbortSignal | undefined;
            mockIterateFolderChildren.mockImplementation(async function* (
                _uid: string,
                _options: any,
                signal: AbortSignal
            ) {
                abortSignalReceived = signal;
                yield createMockNode('child-1', 'Child 1', NodeType.Folder);
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            expect(abortSignalReceived?.aborted).toBe(true);
        });

        it('should track separate abort controllers for each expanded branch', async () => {
            createMyFilesRoot();

            const abortSignals = new Map<string, AbortSignal>();

            // Setup devices iterator to track its abort signal
            mockIterateDevices.mockImplementation(async function* (signal: AbortSignal) {
                abortSignals.set('devices', signal);
                yield createMockDevice('device-1', 'Device 1');
            });

            // Setup shared nodes iterator to track its abort signal
            mockIterateSharedNodesWithMe.mockImplementation(async function* (signal: AbortSignal) {
                abortSignals.set('shared', signal);
                yield createMockNode('shared-1', 'Shared 1', NodeType.Folder);
            });

            // Setup folder children iterator to track its abort signal
            mockIterateFolderChildren.mockImplementation(async function* (
                _uid: string,
                _options: any,
                signal: AbortSignal
            ) {
                abortSignals.set('myfiles', signal);
                yield createMockNode('child-1', 'Child 1', NodeType.Folder);
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
            });

            // Expand devices - should create its own abort controller
            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(null, DEVICES_ROOT_ID));
            });

            expect(abortSignals.get('devices')).toBeDefined();
            const devicesSignal = abortSignals.get('devices');

            // Expand shared with me - should create a separate abort controller
            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            expect(abortSignals.get('shared')).toBeDefined();
            const sharedSignal = abortSignals.get('shared');

            // Expand my files - should create yet another abort controller
            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            expect(abortSignals.get('myfiles')).toBeDefined();
            const myFilesSignal = abortSignals.get('myfiles');

            // All should have their own independent signals
            expect(devicesSignal).not.toBe(sharedSignal);
            expect(devicesSignal).not.toBe(myFilesSignal);
            expect(sharedSignal).not.toBe(myFilesSignal);

            // Collapse only devices - should only abort devices
            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(null, DEVICES_ROOT_ID));
            });

            expect(devicesSignal?.aborted).toBe(true);
            expect(sharedSignal?.aborted).toBe(false);
            expect(myFilesSignal?.aborted).toBe(false);
        });
    });

    describe('get', () => {
        it('should return item by uid', async () => {
            createMyFilesRoot();

            const children = [createMockNode('child-1', 'Child 1', NodeType.Folder)];

            mockIterateFolderChildren.mockReturnValue(createMockIterator(children));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            const item = result.current.get('child-1');

            expect(item?.nodeUid).toBe('child-1');
            expect(item?.name).toBe('Child 1');
        });

        it('should return undefined for non-existent uid', async () => {
            createMyFilesRoot();

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
            });

            const item = result.current.get('non-existent-uid');

            expect(item).toBeUndefined();
        });
    });

    describe('tree structure', () => {
        it('should have correct tree structure with nested children', async () => {
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
            });

            // Tree should have 3 root items
            expect(result.current.treeRoots).toHaveLength(3);
            let myFilesRoot = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFilesRoot).toBeDefined();
            expect(myFilesRoot.children).toBeNull(); // Not expanded

            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            // After expanding, children should be an object
            myFilesRoot = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFilesRoot.children).not.toBeNull();
            expect(Object.keys(myFilesRoot.children)).toHaveLength(2);
            expect(myFilesRoot.children['child-1']).toMatchObject({
                nodeUid: 'child-1',
                name: 'Child 1',
                type: NodeType.Folder,
                children: null, // Not expanded
            });
            expect(myFilesRoot.children['child-2']).toMatchObject({
                nodeUid: 'child-2',
                name: 'Child 2',
                type: NodeType.File,
                children: null, // Files are not expandable
            });
        });

        it('should return empty children object for expanded folder with no children', async () => {
            createMyFilesRoot();

            mockIterateFolderChildren.mockReturnValue(createMockIterator([]));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            // Expanded with no children should be {}
            const myFilesRoot = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(myFilesRoot.children).toEqual({});
        });
    });

    describe('permission handling', () => {
        it('should determine Admin role immediately when node has Admin role', async () => {
            createMyFilesRoot();

            const sharedNodes = [
                {
                    ok: true,
                    value: {
                        uid: 'admin-node',
                        name: 'Admin Folder',
                        type: NodeType.Folder,
                        directRole: MemberRole.Admin,
                        parentUid: null,
                    },
                },
            ];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore({ loadPermissions: true }));

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(Object.keys(sharedRoot.children)).toHaveLength(1);
            expect(sharedRoot.children['admin-node'].highestEffectiveRole).toBe(MemberRole.Admin);
        });

        it('should traverse parent chain to find highest effective role', async () => {
            createMyFilesRoot();

            // Child with Viewer role, parent with Editor role
            const sharedNodes = [
                {
                    ok: true,
                    value: {
                        uid: 'child-viewer',
                        name: 'Child Viewer',
                        type: NodeType.Folder,
                        directRole: MemberRole.Viewer,
                        parentUid: 'parent-editor',
                    },
                },
            ];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));
            mockGetNode.mockResolvedValue({
                ok: true,
                value: {
                    uid: 'parent-editor',
                    name: 'Parent Editor',
                    type: NodeType.Folder,
                    directRole: MemberRole.Editor,
                    parentUid: null,
                },
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore({ loadPermissions: true }));

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(Object.keys(sharedRoot.children)).toHaveLength(1);
            expect(sharedRoot.children['child-viewer'].highestEffectiveRole).toBe(MemberRole.Editor);
        });

        it('should traverse multiple parent levels to find highest role', async () => {
            createMyFilesRoot();

            const sharedNodes = [
                {
                    ok: true,
                    value: {
                        uid: 'child',
                        name: 'Child',
                        type: NodeType.Folder,
                        directRole: MemberRole.Viewer,
                        parentUid: 'parent',
                    },
                },
            ];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));
            mockGetNode
                .mockResolvedValueOnce({
                    ok: true,
                    value: {
                        uid: 'parent',
                        name: 'Parent',
                        type: NodeType.Folder,
                        directRole: MemberRole.Viewer,
                        parentUid: 'grandparent',
                    },
                })
                .mockResolvedValueOnce({
                    ok: true,
                    value: {
                        uid: 'grandparent',
                        name: 'Grandparent',
                        type: NodeType.Folder,
                        directRole: MemberRole.Editor,
                        parentUid: null,
                    },
                });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore({ loadPermissions: true }));

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(sharedRoot.children).not.toBeNull();
            expect(Object.keys(sharedRoot.children)).toHaveLength(1);
            expect(sharedRoot.children.child.highestEffectiveRole).toBe(MemberRole.Editor);
        });

        it('should return more permissive role when comparing Editor and Viewer', async () => {
            createMyFilesRoot();

            const sharedNodes = [
                {
                    ok: true,
                    value: {
                        uid: 'editor-child',
                        name: 'Editor Child',
                        type: NodeType.Folder,
                        directRole: MemberRole.Editor,
                        parentUid: 'viewer-parent',
                    },
                },
            ];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));
            mockGetNode.mockResolvedValue({
                ok: true,
                value: {
                    uid: 'viewer-parent',
                    name: 'Viewer Parent',
                    type: NodeType.Folder,
                    directRole: MemberRole.Viewer,
                    parentUid: null,
                },
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore({ loadPermissions: true }));

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(sharedRoot.children['editor-child'].highestEffectiveRole).toBe(MemberRole.Editor);
        });

        it('should handle degraded parent node during permission check', async () => {
            createMyFilesRoot();

            const sharedNodes = [
                {
                    ok: true,
                    value: {
                        uid: 'child-viewer',
                        name: 'Child Viewer',
                        type: NodeType.Folder,
                        directRole: MemberRole.Viewer,
                        parentUid: 'degraded-parent',
                    },
                },
            ];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));
            mockGetNode.mockResolvedValue({
                ok: false,
                error: {
                    uid: 'degraded-parent',
                    name: 'Degraded Parent',
                    type: NodeType.Folder,
                    directRole: MemberRole.Editor,
                    parentUid: null,
                },
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore({ loadPermissions: true }));

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(Object.keys(sharedRoot.children)).toHaveLength(1);
            expect(sharedRoot.children['child-viewer'].highestEffectiveRole).toBe(MemberRole.Editor);
        });
    });

    describe('tree with shares', () => {
        it('should show deeply nested shared folder twice with non-shared folder in between', async () => {
            createMyFilesRoot();

            // Structure: shared-parent/middle-non-shared/leaf-shared
            const localMockGetNode = jest.fn().mockImplementation((uid) => {
                if (uid === 'middle-non-shared') {
                    return Promise.resolve({
                        ok: true,
                        value: { uid: 'middle-non-shared', directRole: MemberRole.Editor, parentUid: 'shared-parent' },
                    });
                }
                if (uid === 'shared-parent') {
                    return Promise.resolve({
                        ok: true,
                        value: { uid: 'shared-parent', directRole: MemberRole.Editor, parentUid: null },
                    });
                }
            });
            mockDrive.getNode = localMockGetNode;

            mockIterateSharedNodesWithMe.mockReturnValue(
                createMockIterator([
                    createMockNode('shared-parent', 'Shared Parent', NodeType.Folder),
                    {
                        ok: true,
                        value: {
                            uid: 'leaf-shared',
                            name: 'Leaf Shared',
                            type: NodeType.Folder,
                            directRole: MemberRole.Viewer,
                            isShared: false,
                            parentUid: 'middle-non-shared',
                        },
                    },
                ])
            );

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore({ loadPermissions: true }));

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            });

            // Leaf appears at root level
            let sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(sharedRoot.children['leaf-shared']).toBeDefined();
            expect(sharedRoot.children['leaf-shared'].highestEffectiveRole).toBe(MemberRole.Editor);

            // Expand parent shows middle folder (not shared)
            mockIterateFolderChildren.mockReturnValue(
                createMockIterator([
                    {
                        ok: true,
                        value: {
                            uid: 'middle-non-shared',
                            name: 'Middle Non-Shared',
                            type: NodeType.Folder,
                            directRole: MemberRole.Editor,
                            isShared: false,
                        },
                    },
                ])
            );
            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId(SHARED_WITH_ME_ROOT_ID, 'shared-parent'));
            });

            sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            let sharedParent = sharedRoot.children['shared-parent'];
            expect(sharedParent.children['middle-non-shared']).toMatchObject({
                nodeUid: 'middle-non-shared',
                isSharedWithMe: false,
            });

            // Expand middle shows leaf again
            mockIterateFolderChildren.mockReturnValue(
                createMockIterator([
                    {
                        ok: true,
                        value: {
                            uid: 'leaf-shared',
                            name: 'Leaf Shared',
                            type: NodeType.Folder,
                            directRole: MemberRole.Viewer,
                            isShared: true,
                        },
                    },
                ])
            );
            await act(async () => {
                await result.current.toggleExpand(makeTreeItemId('shared-parent', 'middle-non-shared'));
            });

            // Get fresh reference after expansion
            sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            sharedParent = sharedRoot.children['shared-parent'];
            const middleNonShared = sharedParent.children['middle-non-shared'];
            expect(middleNonShared.children['leaf-shared']).toMatchObject({
                nodeUid: 'leaf-shared',
                isSharedWithMe: true,
            });
        });

        it('should not include non-shared items in shared-with-me-root children', async () => {
            createMyFilesRoot();

            const sharedNodes = [createMockNode('shared-1', 'Shared Folder 1', NodeType.Folder)];
            const myFilesChildren = [createMockNode('my-file', 'My File', NodeType.File)];

            mockIterateSharedNodesWithMe.mockReturnValue(createMockIterator(sharedNodes));
            mockIterateFolderChildren.mockReturnValue(createMockIterator(myFilesChildren));

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
                await result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
                await result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));
            });

            // Shared with me should only return shared items
            const sharedRoot = findTreeItem(result.current.treeRoots, SHARED_WITH_ME_ROOT_ID);
            expect(Object.keys(sharedRoot.children)).toHaveLength(1);
            expect(sharedRoot.children['shared-1'].isSharedWithMe).toBe(true);

            // My files should return non-shared items
            const myFilesRoot = findTreeItem(result.current.treeRoots, MY_FILES_ROOT_UID);
            expect(Object.keys(myFilesRoot.children)).toHaveLength(1);
            expect(myFilesRoot.children['my-file'].isSharedWithMe).toBe(false);
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

            expect(result1.current.treeRoots).toHaveLength(3);
            expect(result2.current.treeRoots).toHaveLength(0);
        });
    });

    describe('cleanup on unmount', () => {
        it('should abort all loading branches when component unmounts', async () => {
            createMyFilesRoot();

            const abortSignals = new Map<string, AbortSignal>();
            let devicesYielded = 0;
            let sharedYielded = 0;
            let myFilesYielded = 0;

            // Simulate long-running jobs for devices
            mockIterateDevices.mockImplementation(async function* (signal: AbortSignal) {
                abortSignals.set('devices', signal);
                for (let i = 1; i <= 10; i++) {
                    if (signal.aborted) {
                        throw new Error('Aborted');
                    }

                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(resolve, 100);
                        signal.addEventListener('abort', () => {
                            clearTimeout(timeout);
                            reject(new Error('Aborted'));
                        });
                    });

                    devicesYielded++;
                    yield createMockDevice(`device-${i}`, `Device ${i}`);
                }
            });

            // Simulate long-running jobs for shared with me
            mockIterateSharedNodesWithMe.mockImplementation(async function* (signal: AbortSignal) {
                abortSignals.set('shared', signal);
                for (let i = 1; i <= 10; i++) {
                    if (signal.aborted) {
                        throw new Error('Aborted');
                    }

                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(resolve, 100);
                        signal.addEventListener('abort', () => {
                            clearTimeout(timeout);
                            reject(new Error('Aborted'));
                        });
                    });

                    sharedYielded++;
                    yield createMockNode(`shared-${i}`, `Shared ${i}`, NodeType.Folder);
                }
            });

            // Simulate long-running jobs for folder children
            mockIterateFolderChildren.mockImplementation(async function* (
                _uid: string,
                _options: any,
                signal: AbortSignal
            ) {
                abortSignals.set('myfiles', signal);
                for (let i = 1; i <= 10; i++) {
                    if (signal.aborted) {
                        throw new Error('Aborted');
                    }

                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(resolve, 100);
                        signal.addEventListener('abort', () => {
                            clearTimeout(timeout);
                            reject(new Error('Aborted'));
                        });
                    });

                    myFilesYielded++;
                    yield createMockNode(`child-${i}`, `Child ${i}`, NodeType.Folder);
                }
            });

            const useDirectoryTreeWithStore = directoryTreeFactory();
            const { result, unmount } = renderHook(() => useDirectoryTreeWithStore());

            await act(async () => {
                await result.current.initializeTree();
            });

            // Start expanding multiple branches without awaiting
            const devicesPromise = result.current.toggleExpand(makeTreeItemId(null, DEVICES_ROOT_ID));
            const sharedPromise = result.current.toggleExpand(makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID));
            const myFilesPromise = result.current.toggleExpand(makeTreeItemId(null, MY_FILES_ROOT_UID));

            // Wait a bit for some items to be processed
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 150));
            });

            // Unmount should abort all loading operations
            unmount();

            // All promises should reject due to abort
            await expect(devicesPromise).rejects.toThrow('Aborted');
            await expect(sharedPromise).rejects.toThrow('Aborted');
            await expect(myFilesPromise).rejects.toThrow('Aborted');

            // Verify all abort signals were aborted
            expect(abortSignals.get('devices')?.aborted).toBe(true);
            expect(abortSignals.get('shared')?.aborted).toBe(true);
            expect(abortSignals.get('myfiles')?.aborted).toBe(true);

            // Verify not all items were processed (operations were interrupted)
            expect(devicesYielded).toBeGreaterThan(0);
            expect(devicesYielded).toBeLessThan(10);
            expect(sharedYielded).toBeGreaterThan(0);
            expect(sharedYielded).toBeLessThan(10);
            expect(myFilesYielded).toBeGreaterThan(0);
            expect(myFilesYielded).toBeLessThan(10);
        });
    });
});
