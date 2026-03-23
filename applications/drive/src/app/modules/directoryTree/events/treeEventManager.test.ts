import { NodeType, getDrive } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getDeviceName } from '../../../utils/sdk/getNodeName';
import { directoryTreeStoreFactory } from '../directoryTreeStoreFactory';
import { DEVICES_ROOT_ID, SHARED_WITH_ME_ROOT_ID, makeTreeItemId } from '../helpers';
import type { TreeStoreItem } from '../types';
import { DirectoryTreeRootType } from '../types';
import { TreeEventManager } from './treeEventManager';

jest.mock('@proton/drive/index', () => ({
    ...jest.requireActual('@proton/drive/index'),
    getDrive: jest.fn(),
}));

jest.mock('@proton/drive/internal/BusDriver', () => ({
    ...jest.requireActual('@proton/drive/internal/BusDriver'),
    getBusDriver: jest.fn(),
}));

jest.mock('../../../utils/sdk/getNodeEntity');
jest.mock('../../../utils/sdk/getNodeName');

const mockedGetBusDriver = jest.mocked(getBusDriver);
const mockedGetDrive = jest.mocked(getDrive);
const mockedGetNodeEntity = jest.mocked(getNodeEntity);
const mockedGetDeviceName = jest.mocked(getDeviceName);

// helpers
function makeItem(partial: Partial<TreeStoreItem> & { nodeUid: string }): TreeStoreItem {
    return {
        treeItemId: makeTreeItemId(partial.parentUid ?? null, partial.nodeUid),
        parentUid: null,
        name: partial.nodeUid,
        type: NodeType.Folder,
        expandable: true,
        isSharedWithMe: false,
        ...partial,
    };
}

function makeAsyncIterator<T>(items: T[]) {
    return (async function* () {
        for (const item of items) {
            yield item;
        }
    })();
}

const TEST_CONTEXT = 'directoryTree';
const MY_FILES_ROOT_UID = 'my-files-root';

type SectionName = 'myFiles' | 'devices' | 'shared';

const SECTION_META: Record<SectionName, { uid: string; type: DirectoryTreeRootType; name: string }> = {
    myFiles: { uid: MY_FILES_ROOT_UID, type: DirectoryTreeRootType.FilesRoot, name: 'My files' },
    devices: { uid: DEVICES_ROOT_ID, type: DirectoryTreeRootType.DevicesRoot, name: 'Devices' },
    shared: { uid: SHARED_WITH_ME_ROOT_ID, type: DirectoryTreeRootType.SharesRoot, name: 'Shared with me' },
};

function createManager(store = directoryTreeStoreFactory()) {
    const manager = new TreeEventManager(store, TEST_CONTEXT);
    return { store, manager };
}

function ensureSectionRoot(store: ReturnType<typeof directoryTreeStoreFactory>, section: SectionName) {
    const meta = SECTION_META[section];
    if (!store.getState().items.get(meta.uid)) {
        store.getState().addItem({
            nodeUid: meta.uid,
            treeItemId: makeTreeItemId(null, meta.uid),
            parentUid: null,
            name: meta.name,
            type: meta.type,
            expandable: true,
            isSharedWithMe: false,
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return store.getState().items.get(meta.uid)!;
}

function expandSection(
    store: ReturnType<typeof directoryTreeStoreFactory>,
    manager: TreeEventManager,
    section: SectionName
) {
    const root = ensureSectionRoot(store, section);
    store.getState().setExpanded(root.treeItemId, true);
    manager.syncSubscriptions();
    return root;
}

function collapseSection(
    store: ReturnType<typeof directoryTreeStoreFactory>,
    manager: TreeEventManager,
    section: SectionName
) {
    const root = ensureSectionRoot(store, section);
    store.getState().setExpanded(root.treeItemId, false);
    manager.syncSubscriptions();
}

type ScopeOptions = { nodeUid?: string; parentUid?: string | null; name?: string };

function expandFolderScope(
    store: ReturnType<typeof directoryTreeStoreFactory>,
    manager: TreeEventManager,
    scopeId: string,
    options: ScopeOptions = {}
) {
    const nodeUid = options.nodeUid ?? `${scopeId}-folder`;
    const parentUid = options.parentUid ?? null;
    const existing = store.getState().items.get(nodeUid);
    const item: TreeStoreItem = {
        ...(existing ?? makeItem({ nodeUid, parentUid, name: options.name ?? nodeUid })),
        treeEventScopeId: scopeId,
    };
    store.getState().addItem(item);
    store.getState().setExpanded(item.treeItemId, true);
    manager.syncSubscriptions();
    return item;
}

function collapseFolderScope(
    store: ReturnType<typeof directoryTreeStoreFactory>,
    manager: TreeEventManager,
    folder: TreeStoreItem
) {
    store.getState().setExpanded(folder.treeItemId, false);
    manager.syncSubscriptions();
}

describe('TreeEventManager', () => {
    // Shared event subscriber list – simulates BusDriver fanout
    const eventSubscribers: ((event: any) => Promise<void>)[] = [];

    const mockSubscribeSdkDriveEvents = jest.fn().mockResolvedValue(undefined);
    const mockUnsubscribeSdkDriveEvents = jest.fn().mockResolvedValue(undefined);
    const mockSubscribeSdkEventsScope = jest.fn();
    const mockUnsubscribeSdkEventsScope = jest.fn().mockResolvedValue(undefined);

    const mockBusDriver = {
        subscribe: jest.fn(),
        subscribeSdkDriveEvents: mockSubscribeSdkDriveEvents,
        unsubscribeSdkDriveEvents: mockUnsubscribeSdkDriveEvents,
        subscribeSdkEventsScope: mockSubscribeSdkEventsScope,
        unsubscribeSdkEventsScope: mockUnsubscribeSdkEventsScope,
    };

    const fireEvent = async (event: any) => {
        for (const subscriber of [...eventSubscribers]) {
            await subscriber(event);
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        eventSubscribers.length = 0;

        mockBusDriver.subscribe.mockImplementation((_eventType: any, callback: any) => {
            eventSubscribers.push(callback);
            return jest.fn().mockImplementation(() => {
                const idx = eventSubscribers.indexOf(callback);
                if (idx !== -1) {
                    eventSubscribers.splice(idx, 1);
                }
            });
        });

        mockedGetBusDriver.mockReturnValue(mockBusDriver as any);
    });

    // My Files state updates
    describe('my files – state updates', () => {
        it('UPDATED_NODES – node whose parent is not expanded → no-op', async () => {
            const { store, manager } = createManager();
            // parent folder exists but is NOT expanded
            store.getState().addItem(makeItem({ nodeUid: 'parent-folder' }));
            store.getState().addItem(makeItem({ nodeUid: 'node-1', parentUid: 'parent-folder' }));
            mockedGetNodeEntity.mockReturnValue({
                node: { uid: 'node-1', name: 'Updated', type: NodeType.Folder, parentUid: 'parent-folder' } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandSection(store, manager, 'myFiles');

            await fireEvent({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'node-1', parentUid: 'parent-folder' }],
            });

            // name should NOT have changed because parent-folder is not expanded
            expect(store.getState().items.get('node-1')?.name).toBe('node-1');
        });

        it('UPDATED_NODES – node whose parent is expanded → update state', async () => {
            const { store, manager } = createManager();
            const parent = makeItem({ nodeUid: 'parent-folder' });
            store.getState().addItem(parent);
            store.getState().setExpanded(parent.treeItemId, true);
            store.getState().addItem(makeItem({ nodeUid: 'node-1', parentUid: 'parent-folder', name: 'Original' }));
            mockedGetNodeEntity.mockReturnValue({
                node: { uid: 'node-1', name: 'Updated', type: NodeType.Folder, parentUid: 'parent-folder' } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandSection(store, manager, 'myFiles');

            await fireEvent({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'node-1', parentUid: 'parent-folder' }],
            });

            expect(store.getState().items.get('node-1')?.name).toBe('Updated');
        });

        it('CREATED_NODES – new node in expanded folder → add to state', async () => {
            const { store, manager } = createManager();
            const parent = makeItem({ nodeUid: 'parent-folder' });
            store.getState().addItem(parent);
            store.getState().setExpanded(parent.treeItemId, true);
            mockedGetNodeEntity.mockReturnValue({
                node: {
                    uid: 'new-folder',
                    name: 'New Folder',
                    type: NodeType.Folder,
                    parentUid: 'parent-folder',
                } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandSection(store, manager, 'myFiles');

            await fireEvent({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'new-folder', parentUid: 'parent-folder' }],
            });

            expect(store.getState().items.get('new-folder')).toBeDefined();
        });

        it('DELETED_NODES – node in expanded folder → remove from state', async () => {
            const { store, manager } = createManager();
            store.getState().addItem(makeItem({ nodeUid: 'folder-1' }));
            expandSection(store, manager, 'myFiles');

            await fireEvent({ type: BusDriverEventName.DELETED_NODES, uids: ['folder-1'] });

            expect(store.getState().items.has('folder-1')).toBe(false);
        });

        it('TRASHED_NODES – node in expanded folder → remove from state', async () => {
            const { store, manager } = createManager();
            store.getState().addItem(makeItem({ nodeUid: 'folder-1' }));
            expandSection(store, manager, 'myFiles');

            await fireEvent({ type: BusDriverEventName.TRASHED_NODES, uids: ['folder-1'] });

            expect(store.getState().items.has('folder-1')).toBe(false);
        });

        it('UPDATED_NODES – isTrashed → remove from state', async () => {
            const { store, manager } = createManager();
            store.getState().addItem(makeItem({ nodeUid: 'folder-1' }));
            expandSection(store, manager, 'myFiles');

            await fireEvent({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'folder-1', parentUid: null, isTrashed: true }],
            });

            expect(store.getState().items.has('folder-1')).toBe(false);
        });
    });

    // Devices state updates
    describe('devices – state updates', () => {
        it('RENAMED_DEVICES – devices not expanded → no-op', async () => {
            const { store, manager } = createManager();
            store.getState().addItem(
                makeItem({
                    nodeUid: 'device-1',
                    parentUid: DEVICES_ROOT_ID,
                    type: DirectoryTreeRootType.Device,
                    name: 'Old',
                })
            );
            // do NOT expand devices
            manager.syncSubscriptions();

            await fireEvent({
                type: BusDriverEventName.RENAMED_DEVICES,
                items: [{ deviceUid: 'device-1', newName: 'New' }],
            });

            // No listener registered → event never fired
            expect(store.getState().items.get('device-1')?.name).toBe('Old');
        });

        it('RENAMED_DEVICES – devices expanded → update device name', async () => {
            const { store, manager } = createManager();
            store.getState().addItem(
                makeItem({
                    nodeUid: 'device-1',
                    parentUid: DEVICES_ROOT_ID,
                    type: DirectoryTreeRootType.Device,
                    name: 'Old',
                })
            );
            expandSection(store, manager, 'devices');

            await fireEvent({
                type: BusDriverEventName.RENAMED_DEVICES,
                items: [{ deviceUid: 'device-1', newName: 'New' }],
            });

            expect(store.getState().items.get('device-1')?.name).toBe('New');
        });

        it('CREATED_NODES – new device root node (parentUid=undefined) → add to state', async () => {
            const { store, manager } = createManager();
            mockedGetDeviceName.mockReturnValue('My PC');
            const rootScopeId = 'root-scope-id';
            mockedGetNodeEntity
                .mockReturnValueOnce({
                    node: { uid: MY_FILES_ROOT_UID, treeEventScopeId: rootScopeId } as any,
                    errors: new Map(),
                })
                .mockReturnValueOnce({
                    node: { uid: 'new-device', treeEventScopeId: rootScopeId } as any,
                    errors: new Map(),
                });
            mockedGetDrive.mockReturnValue({
                getMyFilesRootFolder: jest.fn().mockResolvedValue({ ok: true, value: { uid: MY_FILES_ROOT_UID } }),
                getNode: jest.fn().mockResolvedValue({ ok: true, value: { uid: 'new-device' } }),
                iterateDevices: jest
                    .fn()
                    .mockReturnValue(
                        makeAsyncIterator([{ rootFolderUid: 'new-device', name: { ok: true, value: 'My PC' } }])
                    ),
            } as any);
            expandSection(store, manager, 'devices');

            await fireEvent({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'new-device', parentUid: undefined }],
            });

            const item = store.getState().items.get('new-device');
            expect(item).toBeDefined();
            expect(item?.name).toBe('My PC');
            expect(item?.type).toBe(DirectoryTreeRootType.Device);
            expect(item?.parentUid).toBe(DEVICES_ROOT_ID);
        });

        it('REMOVED_DEVICES – devices expanded → remove from state', async () => {
            const { store, manager } = createManager();
            store
                .getState()
                .addItem(
                    makeItem({ nodeUid: 'device-1', parentUid: DEVICES_ROOT_ID, type: DirectoryTreeRootType.Device })
                );
            expandSection(store, manager, 'devices');

            await fireEvent({ type: BusDriverEventName.REMOVED_DEVICES, deviceUids: ['device-1'] });

            expect(store.getState().items.has('device-1')).toBe(false);
        });

        it('REMOVED_DEVICES – devices not expanded → no-op', async () => {
            const { store, manager } = createManager();
            store
                .getState()
                .addItem(
                    makeItem({ nodeUid: 'device-1', parentUid: DEVICES_ROOT_ID, type: DirectoryTreeRootType.Device })
                );
            manager.syncSubscriptions();

            await fireEvent({ type: BusDriverEventName.REMOVED_DEVICES, deviceUids: ['device-1'] });

            expect(store.getState().items.has('device-1')).toBe(true);
        });

        it('UPDATED_NODES – node inside a device that is not expanded → no-op', async () => {
            const { store, manager } = createManager();
            // devices root is expanded but the device folder itself is NOT
            const device = makeItem({
                nodeUid: 'device-1',
                parentUid: DEVICES_ROOT_ID,
                type: DirectoryTreeRootType.Device,
            });
            store.getState().addItem(device);
            store.getState().addItem(makeItem({ nodeUid: 'child-1', parentUid: 'device-1', name: 'Original' }));
            mockedGetNodeEntity.mockReturnValue({
                node: { uid: 'child-1', name: 'Updated', type: NodeType.Folder, parentUid: 'device-1' } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandSection(store, manager, 'devices');
            // device-1 itself is NOT marked as expanded

            await fireEvent({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'child-1', parentUid: 'device-1' }],
            });

            expect(store.getState().items.get('child-1')?.name).toBe('Original');
        });

        it('UPDATED_NODES – node inside a device that is expanded → update state', async () => {
            const { store, manager } = createManager();
            const device = makeItem({
                nodeUid: 'device-1',
                parentUid: DEVICES_ROOT_ID,
                type: DirectoryTreeRootType.Device,
            });
            store.getState().addItem(device);
            store.getState().setExpanded(device.treeItemId, true); // device itself is expanded
            store.getState().addItem(makeItem({ nodeUid: 'child-1', parentUid: 'device-1', name: 'Original' }));
            mockedGetNodeEntity.mockReturnValue({
                node: { uid: 'child-1', name: 'Updated', type: NodeType.Folder, parentUid: 'device-1' } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandSection(store, manager, 'devices');

            await fireEvent({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'child-1', parentUid: 'device-1' }],
            });

            expect(store.getState().items.get('child-1')?.name).toBe('Updated');
        });
    });

    // Shared with me state updates
    describe('shared with me – state updates', () => {
        it('REFRESH_SHARED_WITH_ME – shared not expanded → no-op', async () => {
            const { store, manager } = createManager();
            store
                .getState()
                .addItem(makeItem({ nodeUid: 'shared-1', parentUid: SHARED_WITH_ME_ROOT_ID, isSharedWithMe: true }));
            manager.syncSubscriptions(); // nothing expanded

            await fireEvent({ type: BusDriverEventName.REFRESH_SHARED_WITH_ME });

            expect(store.getState().items.has('shared-1')).toBe(true);
        });

        it('REFRESH_SHARED_WITH_ME – shared expanded → update list by fetching and comparing', async () => {
            const { store, manager } = createManager();
            // existing item that should be removed
            store
                .getState()
                .addItem(makeItem({ nodeUid: 'old-shared', parentUid: SHARED_WITH_ME_ROOT_ID, isSharedWithMe: true }));
            mockedGetNodeEntity.mockImplementation((item: any) => ({
                node: item.value ?? item.error,
                errors: new Map(),
            }));
            mockedGetDrive.mockReturnValue({
                iterateSharedNodesWithMe: jest.fn().mockReturnValue(
                    makeAsyncIterator([
                        {
                            ok: true,
                            value: {
                                uid: 'new-shared',
                                name: 'New Item',
                                type: NodeType.Folder,
                                deprecatedShareId: 'share-new',
                                membership: {},
                                keyAuthor: { ok: true },
                                nameAuthor: { ok: true },
                            },
                        },
                    ])
                ),
            } as any);
            expandSection(store, manager, 'shared');

            await fireEvent({ type: BusDriverEventName.REFRESH_SHARED_WITH_ME });

            expect(store.getState().items.has('old-shared')).toBe(false);
            expect(store.getState().items.get('new-shared')?.name).toBe('New Item');
        });

        it('UPDATED_NODES – node in shared with me that is not expanded → no-op', async () => {
            const { store, manager } = createManager();
            const sharedRoot = ensureSectionRoot(store, 'shared');
            // shared root is in store but NOT expanded
            store
                .getState()
                .addItem(
                    makeItem({ nodeUid: 'shared-folder', parentUid: SHARED_WITH_ME_ROOT_ID, isSharedWithMe: true })
                );
            store.getState().addItem(makeItem({ nodeUid: 'child-1', parentUid: 'shared-folder', name: 'Original' }));
            mockedGetNodeEntity.mockReturnValue({
                node: { uid: 'child-1', name: 'Updated', type: NodeType.Folder, parentUid: 'shared-folder' } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            // expand shared root so listener is registered, but NOT the shared-folder
            store.getState().setExpanded(sharedRoot.treeItemId, true);
            manager.syncSubscriptions();

            await fireEvent({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'child-1', parentUid: 'shared-folder' }],
            });

            expect(store.getState().items.get('child-1')?.name).toBe('Original');
        });

        it('UPDATED_NODES – node in shared with me that is expanded → update state', async () => {
            const { store, manager } = createManager();
            const sharedFolder = makeItem({
                nodeUid: 'shared-folder',
                parentUid: SHARED_WITH_ME_ROOT_ID,
                isSharedWithMe: true,
            });
            store.getState().addItem(sharedFolder);
            store.getState().setExpanded(sharedFolder.treeItemId, true);
            store.getState().addItem(makeItem({ nodeUid: 'child-1', parentUid: 'shared-folder', name: 'Original' }));
            mockedGetNodeEntity.mockReturnValue({
                node: { uid: 'child-1', name: 'Updated', type: NodeType.Folder, parentUid: 'shared-folder' } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandSection(store, manager, 'shared');

            await fireEvent({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'child-1', parentUid: 'shared-folder' }],
            });

            expect(store.getState().items.get('child-1')?.name).toBe('Updated');
        });

        it('CREATED_NODES – new node in expanded shared folder → add to state', async () => {
            const { store, manager } = createManager();
            // Shared folders need a treeEventScopeId — CREATED_NODES fires only when scopes.size > 0
            store
                .getState()
                .addItem(
                    makeItem({ nodeUid: 'shared-folder', parentUid: SHARED_WITH_ME_ROOT_ID, isSharedWithMe: true })
                );
            mockedGetNodeEntity.mockReturnValue({
                node: { uid: 'new-child', name: 'New Child', type: NodeType.Folder, parentUid: 'shared-folder' } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandFolderScope(store, manager, 'scope-shared', {
                nodeUid: 'shared-folder',
                parentUid: SHARED_WITH_ME_ROOT_ID,
            });

            await fireEvent({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'new-child', parentUid: 'shared-folder' }],
            });

            expect(store.getState().items.get('new-child')).toBeDefined();
        });

        it('DELETED_NODES – node in expanded shared folder → remove from state', async () => {
            const { store, manager } = createManager();
            const sharedFolder = makeItem({
                nodeUid: 'shared-folder',
                parentUid: SHARED_WITH_ME_ROOT_ID,
                isSharedWithMe: true,
            });
            store.getState().addItem(sharedFolder);
            store.getState().addItem(makeItem({ nodeUid: 'child-1', parentUid: 'shared-folder' }));
            expandSection(store, manager, 'shared');

            await fireEvent({ type: BusDriverEventName.DELETED_NODES, uids: ['child-1'] });

            expect(store.getState().items.has('child-1')).toBe(false);
        });

        it('TRASHED_NODES – node in expanded shared folder → remove from state', async () => {
            const { store, manager } = createManager();
            const sharedFolder = makeItem({
                nodeUid: 'shared-folder',
                parentUid: SHARED_WITH_ME_ROOT_ID,
                isSharedWithMe: true,
            });
            store.getState().addItem(sharedFolder);
            store.getState().addItem(makeItem({ nodeUid: 'child-1', parentUid: 'shared-folder' }));
            expandSection(store, manager, 'shared');

            await fireEvent({ type: BusDriverEventName.TRASHED_NODES, uids: ['child-1'] });

            expect(store.getState().items.has('child-1')).toBe(false);
        });
    });

    // Folder scope (shared-with-me expanded nodes) state updates
    describe('folder scope – state updates', () => {
        const ALICE_SCOPE = 'scope-alice';

        it('CREATED_NODES – new node in expanded scoped folder → add to state', async () => {
            const { store, manager } = createManager();
            const parent = makeItem({ nodeUid: 'parent-folder' });
            store.getState().addItem(parent);
            store.getState().setExpanded(parent.treeItemId, true);
            mockedGetNodeEntity.mockReturnValue({
                node: {
                    uid: 'new-folder',
                    name: 'New Folder',
                    type: NodeType.Folder,
                    parentUid: 'parent-folder',
                } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandFolderScope(store, manager, ALICE_SCOPE, {
                nodeUid: 'alice-root',
                parentUid: SHARED_WITH_ME_ROOT_ID,
            });

            await fireEvent({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'new-folder', parentUid: 'parent-folder' }],
            });

            expect(store.getState().items.get('new-folder')).toBeDefined();
        });

        it('DELETED_NODES – node in expanded scoped folder → remove from state', async () => {
            const { store, manager } = createManager();
            store.getState().addItem(makeItem({ nodeUid: 'node-1' }));
            expandFolderScope(store, manager, ALICE_SCOPE, {
                nodeUid: 'alice-root',
                parentUid: SHARED_WITH_ME_ROOT_ID,
            });

            await fireEvent({ type: BusDriverEventName.DELETED_NODES, uids: ['node-1'] });

            expect(store.getState().items.has('node-1')).toBe(false);
        });

        it('TRASHED_NODES – node in expanded scoped folder → remove from state', async () => {
            const { store, manager } = createManager();
            store.getState().addItem(makeItem({ nodeUid: 'node-1' }));
            expandFolderScope(store, manager, ALICE_SCOPE, {
                nodeUid: 'alice-root',
                parentUid: SHARED_WITH_ME_ROOT_ID,
            });

            await fireEvent({ type: BusDriverEventName.TRASHED_NODES, uids: ['node-1'] });

            expect(store.getState().items.has('node-1')).toBe(false);
        });

        it('UPDATED_NODES – node in expanded scoped folder → update state', async () => {
            const { store, manager } = createManager();
            const parent = makeItem({ nodeUid: 'alice-root', parentUid: SHARED_WITH_ME_ROOT_ID });
            store.getState().addItem(parent);
            store.getState().setExpanded(parent.treeItemId, true);
            store.getState().addItem(makeItem({ nodeUid: 'node-1', parentUid: 'alice-root', name: 'Original' }));
            mockedGetNodeEntity.mockReturnValue({
                node: { uid: 'node-1', name: 'Updated', type: NodeType.Folder, parentUid: 'alice-root' } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandFolderScope(store, manager, ALICE_SCOPE, {
                nodeUid: 'alice-root',
                parentUid: SHARED_WITH_ME_ROOT_ID,
            });

            await fireEvent({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'node-1', parentUid: 'alice-root' }],
            });

            expect(store.getState().items.get('node-1')?.name).toBe('Updated');
        });

        it('UPDATED_NODES – node visible in two expanded contexts → updates the stored entry', async () => {
            // Setup: nodeB has treeEventScopeId and is visible under two paths.
            // The store only holds one entry per nodeUid; whichever treeItemId is current
            // determines whether shouldUpdateNode passes for children.
            const { store, manager } = createManager();

            // nodeB is visible at top-level shared AND as child of a shared parent
            // Store entry reflects its current parentUid context
            const nodeB = makeItem({ nodeUid: 'node-b', parentUid: 'shared-parent', treeEventScopeId: ALICE_SCOPE });
            store.getState().addItem(nodeB);
            store.getState().setExpanded(nodeB.treeItemId, true); // node-b is expanded

            // node-c is a child of node-b
            store.getState().addItem(makeItem({ nodeUid: 'node-c', parentUid: 'node-b', name: 'Original' }));

            mockedGetNodeEntity.mockReturnValue({
                node: { uid: 'node-c', name: 'Updated', type: NodeType.Folder, parentUid: 'node-b' } as any,
                errors: new Map(),
            });
            mockedGetDrive.mockReturnValue({ getNode: jest.fn().mockResolvedValue({ ok: true, value: {} }) } as any);
            expandFolderScope(store, manager, ALICE_SCOPE, { nodeUid: 'node-b', parentUid: 'shared-parent' });

            await fireEvent({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'node-c', parentUid: 'node-b' }],
            });

            expect(store.getState().items.get('node-c')?.name).toBe('Updated');
        });
    });

    // Subscription tracking
    describe('subscription tracking', () => {
        it('bus listener starts at construction; stops at destroy()', () => {
            const { manager } = createManager();
            expect(mockBusDriver.subscribe).toHaveBeenCalledTimes(1);
            const unsubscribe = mockBusDriver.subscribe.mock.results[0]?.value as jest.Mock;

            manager.destroy();
            expect(unsubscribe).toHaveBeenCalledTimes(1);
        });

        it('exactly one bus listener regardless of how many sections are expanded; survives collapse; stops at destroy()', () => {
            const { store, manager } = createManager();
            expect(mockBusDriver.subscribe).toHaveBeenCalledTimes(1);
            const unsubscribe = mockBusDriver.subscribe.mock.results[0]?.value as jest.Mock;

            expandSection(store, manager, 'devices');
            expandSection(store, manager, 'myFiles');
            expect(mockBusDriver.subscribe).toHaveBeenCalledTimes(1); // no extra listener

            collapseSection(store, manager, 'devices');
            expect(unsubscribe).not.toHaveBeenCalled(); // listener kept

            collapseSection(store, manager, 'myFiles');
            expect(unsubscribe).not.toHaveBeenCalled(); // listener kept until destroy

            manager.destroy();
            expect(unsubscribe).toHaveBeenCalledTimes(1);
        });

        it('expand shared with me → subscribeSdkDriveEvents; collapse → unsubscribeSdkDriveEvents', () => {
            const { store, manager } = createManager();
            expandSection(store, manager, 'shared');
            expect(mockSubscribeSdkDriveEvents).toHaveBeenCalledWith(TEST_CONTEXT);

            collapseSection(store, manager, 'shared');
            expect(mockUnsubscribeSdkDriveEvents).toHaveBeenCalledWith(TEST_CONTEXT);
        });

        it('expand node from Alice → subscribeSdkEventsScope(aliceScope); expand 2nd Alice node → no change; collapse first → no change; collapse second → unsubscribeSdkEventsScope(aliceScope)', () => {
            const { store, manager } = createManager();
            const ALICE_SCOPE = 'scope-alice';

            const alice1 = expandFolderScope(store, manager, ALICE_SCOPE, {
                nodeUid: 'alice-1',
                parentUid: SHARED_WITH_ME_ROOT_ID,
            });
            expect(mockSubscribeSdkEventsScope).toHaveBeenCalledWith(ALICE_SCOPE, TEST_CONTEXT);
            expect(mockSubscribeSdkEventsScope).toHaveBeenCalledTimes(1);

            const alice2 = expandFolderScope(store, manager, ALICE_SCOPE, { nodeUid: 'alice-2', parentUid: 'alice-1' });
            expect(mockSubscribeSdkEventsScope).toHaveBeenCalledTimes(1); // no change

            collapseFolderScope(store, manager, alice1);
            expect(mockUnsubscribeSdkEventsScope).not.toHaveBeenCalled(); // alice-2 still expanded

            collapseFolderScope(store, manager, alice2);
            expect(mockUnsubscribeSdkEventsScope).toHaveBeenCalledWith(ALICE_SCOPE, TEST_CONTEXT);
        });

        it('expand node from Alice → sub; expand node from Bob → sub; collapse Alice → unsub Alice only', () => {
            const { store, manager } = createManager();
            const ALICE_SCOPE = 'scope-alice';
            const BOB_SCOPE = 'scope-bob';

            const alice = expandFolderScope(store, manager, ALICE_SCOPE, {
                nodeUid: 'alice-root',
                parentUid: SHARED_WITH_ME_ROOT_ID,
            });
            expect(mockSubscribeSdkEventsScope).toHaveBeenCalledWith(ALICE_SCOPE, TEST_CONTEXT);

            expandFolderScope(store, manager, BOB_SCOPE, { nodeUid: 'bob-root', parentUid: SHARED_WITH_ME_ROOT_ID });
            expect(mockSubscribeSdkEventsScope).toHaveBeenCalledWith(BOB_SCOPE, TEST_CONTEXT);

            collapseFolderScope(store, manager, alice);
            expect(mockUnsubscribeSdkEventsScope).toHaveBeenCalledWith(ALICE_SCOPE, TEST_CONTEXT);
            expect(mockUnsubscribeSdkEventsScope).not.toHaveBeenCalledWith(BOB_SCOPE, TEST_CONTEXT);
        });

        it('expand Alice node → sub; event deletes that node → unsub from aliceScope', async () => {
            const { store, manager } = createManager();
            const ALICE_SCOPE = 'scope-alice';

            expandFolderScope(store, manager, ALICE_SCOPE, {
                nodeUid: 'alice-root',
                parentUid: SHARED_WITH_ME_ROOT_ID,
            });
            expect(mockSubscribeSdkEventsScope).toHaveBeenCalledWith(ALICE_SCOPE, TEST_CONTEXT);

            await fireEvent({ type: BusDriverEventName.DELETED_NODES, uids: ['alice-root'] });

            expect(mockUnsubscribeSdkEventsScope).toHaveBeenCalledWith(ALICE_SCOPE, TEST_CONTEXT);
        });

        it('expand two Alice nodes → sub; event deletes one → no unsub (other still expanded)', async () => {
            const { store, manager } = createManager();
            const ALICE_SCOPE = 'scope-alice';

            expandFolderScope(store, manager, ALICE_SCOPE, { nodeUid: 'alice-1', parentUid: SHARED_WITH_ME_ROOT_ID });
            expandFolderScope(store, manager, ALICE_SCOPE, { nodeUid: 'alice-2', parentUid: 'alice-1' });
            expect(mockSubscribeSdkEventsScope).toHaveBeenCalledTimes(1);

            await fireEvent({ type: BusDriverEventName.DELETED_NODES, uids: ['alice-1'] });

            // alice-2 still has the same scopeId, so scope is still needed
            expect(mockUnsubscribeSdkEventsScope).not.toHaveBeenCalled();
            expect(store.getState().items.has('alice-1')).toBe(false);
        });

        it('destroy() removes all subscriptions', () => {
            const { store, manager } = createManager();
            expandSection(store, manager, 'shared');
            expect(mockSubscribeSdkDriveEvents).toHaveBeenCalled();
            const unsubscribe = mockBusDriver.subscribe.mock.results[0]?.value as jest.Mock;

            manager.destroy();
            expect(mockUnsubscribeSdkDriveEvents).toHaveBeenCalledWith(TEST_CONTEXT);
            expect(unsubscribe).toHaveBeenCalledTimes(1);
        });
    });
});
