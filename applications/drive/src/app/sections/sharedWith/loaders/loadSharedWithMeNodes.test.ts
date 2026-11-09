import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNotificationsManager } from '@proton/drive/modules/notifications';

import { ItemType, useSharedWithMeStore } from '../useSharedWithMe.store';
import { loadSharedWithMeNodes } from './loadSharedWithMeNodes';

jest.mock('@proton/drive/sdk', () => ({
    getDrive: jest.fn(),
    getDriveForPhotos: jest.fn(),
    splitNodeUid: jest.fn((uid: string) => ({ volumeId: `volume-${uid}` })),
}));

jest.mock('@proton/drive/modules/notifications', () => ({
    getNotificationsManager: jest.fn(),
}));

jest.mock('@proton/drive/legacy/errorHandling', () => ({
    ...jest.requireActual('@proton/drive/legacy/errorHandling'),
    handleSdkError: jest.fn(),
}));

jest.mock('@proton/drive/legacy/sdkUtils/getNodeEntity', () => ({
    getNodeEntity: jest.fn((node: unknown) => ({ node })),
}));

jest.mock('../../../utils/sdk/getSignatureIssues', () => ({
    getSignatureIssues: jest.fn(() => ({ ok: true })),
}));

const { getDrive, getDriveForPhotos } = jest.mocked(require('@proton/drive/sdk'));

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
        iterateSharedWithMeNodeUids: jest.fn(() =>
            asyncIteratorFrom([...nodes.map((node) => node.uid), ...missingUids])
        ),
        iterateNodes: jest.fn((uids: string[]) =>
            asyncIteratorFrom(uids.map((uid) => nodes.find((node) => node.uid === uid) ?? { missingUid: uid }))
        ),
    };
}

const mockCreateNotification = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    useSharedWithMeStore.setState({ isLoadingNodes: false });
    jest.mocked(getNotificationsManager).mockReturnValue({ createNotification: mockCreateNotification } as any);
    getDriveForPhotos.mockReturnValue(fakeDrive([]));
});

describe('loadSharedWithMeNodes', () => {
    it('loads the shared with me nodes of Drive and Photos into the store', async () => {
        const setSharedWithMeItem = jest.spyOn(useSharedWithMeStore.getState(), 'setSharedWithMeItem');
        const cleanupStaleItems = jest.spyOn(useSharedWithMeStore.getState(), 'cleanupStaleItems');
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
        const setSharedWithMeItem = jest.spyOn(useSharedWithMeStore.getState(), 'setSharedWithMeItem');
        getDrive.mockReturnValue(fakeDrive([fakeSharedNode('drive-1')], ['deleted-node']));

        await loadSharedWithMeNodes(new AbortController().signal);

        expect(setSharedWithMeItem).toHaveBeenCalledTimes(1);
        expect(setSharedWithMeItem).toHaveBeenCalledWith(expect.objectContaining({ nodeUid: 'drive-1' }));
        expect(handleSdkError).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it('skips nodes without a direct membership', async () => {
        const setSharedWithMeItem = jest.spyOn(useSharedWithMeStore.getState(), 'setSharedWithMeItem');
        getDrive.mockReturnValue(fakeDrive([fakeSharedNode('drive-1', { membership: undefined })]));

        await loadSharedWithMeNodes(new AbortController().signal);

        expect(setSharedWithMeItem).not.toHaveBeenCalled();
    });

    it('shows one error notification when the listing fails', async () => {
        const error = new Error('listing failed');
        getDrive.mockReturnValue({
            iterateSharedWithMeNodeUids: jest.fn(async function* () {
                throw error;
            }),
            iterateNodes: jest.fn(),
        });

        await loadSharedWithMeNodes(new AbortController().signal);

        expect(handleSdkError).toHaveBeenCalledWith(error, { showNotification: false });
        expect(mockCreateNotification).toHaveBeenCalledWith({
            type: 'error',
            text: 'We were not able to load some items shared with you',
        });
    });
});
