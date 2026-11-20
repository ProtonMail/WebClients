import type { Mock } from 'vitest';

import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNotificationsManager } from '@proton/drive/modules/notifications';
import * as mod1 from '@proton/drive/sdk';

import { ItemType, useSharedWithMeStore } from '../useSharedWithMe.store';
import { loadSharedWithMeNodes } from './loadSharedWithMeNodes';

vi.mock('@proton/drive/sdk', () => ({
    getDrive: vi.fn(),
    getDriveForPhotos: vi.fn(),
    splitNodeUid: vi.fn((uid: string) => ({ volumeId: `volume-${uid}` })),
}));

vi.mock('@proton/drive/modules/notifications', () => ({
    getNotificationsManager: vi.fn(),
}));

vi.mock('@proton/drive/legacy/errorHandling', async () => ({
    ...(await vi.importActual('@proton/drive/legacy/errorHandling')),
    handleSdkError: vi.fn(),
}));

vi.mock('@proton/drive/legacy/sdkUtils/getNodeEntity', () => ({
    getNodeEntity: vi.fn((node: unknown) => ({ node })),
}));

vi.mock('../../../utils/sdk/getSignatureIssues', () => ({
    getSignatureIssues: vi.fn(() => ({ ok: true })),
}));

const { getDrive, getDriveForPhotos } = vi.mocked(mod1) as unknown as Record<'getDrive' | 'getDriveForPhotos', Mock>;

function fakeSharedNode(uid: string, overrides = {}) {
    return {
        uid,
        name: `name-${uid}`,
        type: 'file',
        mediaType: undefined,
        totalStorageSize: 10,
        directRole: 'viewer',
        deprecatedShareId: `share-${uid}`,
        membership: {
            inviteTime: new Date(0),
            sharedBy: { ok: true, value: 'owner@example.com' },
        },
        ...overrides,
    };
}

async function* asyncIteratorFrom<T>(items: T[]): AsyncGenerator<T> {
    for (const item of items) {
        yield item;
    }
}

// Mocks the shared with me UID listing and the loading of those UIDs, like the SDK does.
function fakeDrive(nodes: ReturnType<typeof fakeSharedNode>[], missingUids: string[] = []) {
    return {
        iterateSharedWithMeNodeUids: vi.fn(() => asyncIteratorFrom([...nodes.map((node) => node.uid), ...missingUids])),
        iterateNodes: vi.fn((uids: string[]) =>
            asyncIteratorFrom(uids.map((uid) => nodes.find((node) => node.uid === uid) ?? { missingUid: uid }))
        ),
    };
}

const mockCreateNotification = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    useSharedWithMeStore.setState({ isLoadingNodes: false });
    vi.mocked(getNotificationsManager).mockReturnValue({ createNotification: mockCreateNotification } as any);
    getDriveForPhotos.mockReturnValue(fakeDrive([]));
});

describe('loadSharedWithMeNodes', () => {
    it('loads the shared with me nodes of Drive and Photos into the store', async () => {
        const setSharedWithMeItem = vi.spyOn(useSharedWithMeStore.getState(), 'setSharedWithMeItem');
        const cleanupStaleItems = vi.spyOn(useSharedWithMeStore.getState(), 'cleanupStaleItems');
        const drive = fakeDrive([fakeSharedNode('drive-1')]);
        getDrive.mockReturnValue(drive);
        getDriveForPhotos.mockReturnValue(fakeDrive([fakeSharedNode('photo-1')]));
        const abortSignal = new AbortController().signal;

        await loadSharedWithMeNodes(abortSignal);

        expect(drive.iterateSharedWithMeNodeUids).toHaveBeenCalledWith(abortSignal);
        expect(drive.iterateNodes).toHaveBeenCalledWith(['drive-1'], abortSignal);
        expect(setSharedWithMeItem).toHaveBeenCalledTimes(2);
        expect(setSharedWithMeItem).toHaveBeenCalledWith(
            expect.objectContaining({
                nodeUid: 'drive-1',
                itemType: ItemType.DIRECT_SHARE,
                shareId: 'share-drive-1',
                directShare: { sharedOn: new Date(0), sharedBy: 'owner@example.com' },
            })
        );
        expect(setSharedWithMeItem).toHaveBeenCalledWith(expect.objectContaining({ nodeUid: 'photo-1' }));
        expect(cleanupStaleItems).toHaveBeenCalledWith(ItemType.DIRECT_SHARE, new Set(['drive-1', 'photo-1']));
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it('skips nodes deleted between the listing and the loading without an error', async () => {
        const setSharedWithMeItem = vi.spyOn(useSharedWithMeStore.getState(), 'setSharedWithMeItem');
        getDrive.mockReturnValue(fakeDrive([fakeSharedNode('drive-1')], ['deleted-node']));

        await loadSharedWithMeNodes(new AbortController().signal);

        expect(setSharedWithMeItem).toHaveBeenCalledTimes(1);
        expect(setSharedWithMeItem).toHaveBeenCalledWith(expect.objectContaining({ nodeUid: 'drive-1' }));
        expect(handleSdkError).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it('skips nodes without a direct membership', async () => {
        const setSharedWithMeItem = vi.spyOn(useSharedWithMeStore.getState(), 'setSharedWithMeItem');
        getDrive.mockReturnValue(fakeDrive([fakeSharedNode('drive-1', { membership: undefined })]));

        await loadSharedWithMeNodes(new AbortController().signal);

        expect(setSharedWithMeItem).not.toHaveBeenCalled();
    });

    it('shows one error notification when the listing fails', async () => {
        const error = new Error('listing failed');
        getDrive.mockReturnValue({
            iterateSharedWithMeNodeUids: vi.fn(async function* () {
                throw error;
            }),
            iterateNodes: vi.fn(),
        });

        await loadSharedWithMeNodes(new AbortController().signal);

        expect(handleSdkError).toHaveBeenCalledWith(error, { showNotification: false });
        expect(mockCreateNotification).toHaveBeenCalledWith({
            type: 'error',
            text: 'We were not able to load some items shared with you',
        });
    });
});
