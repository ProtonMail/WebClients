import { getNotificationsManager } from '../../../modules/notifications';
import { useSharedWithMeStore } from '../useSharedWithMe.store';
import { loadInvitations } from './loadInvitations';

jest.mock('@proton/drive/index', () => ({
    getDrive: jest.fn(),
    getDriveForPhotos: jest.fn(),
    splitInvitationUid: jest.fn((uid: string) => ({ shareId: `share-${uid}` })),
}));

jest.mock('../../../modules/notifications', () => ({
    getNotificationsManager: jest.fn(),
}));

jest.mock('../../../utils/errorHandling/handleSdkError', () => ({
    handleSdkError: jest.fn(),
}));

const { getDrive, getDriveForPhotos } = jest.mocked(require('@proton/drive/index'));

function fakeInvitation(uid: string) {
    return {
        uid,
        node: {
            uid: `node-${uid}`,
            name: { ok: true, value: `name-${uid}` },
            type: 'file',
            mediaType: undefined,
        },
        addedByEmail: { ok: true, value: `user-${uid}@example.com` },
    };
}

async function* asyncIteratorFrom<T>(items: T[]): AsyncGenerator<T> {
    for (const item of items) {
        yield item;
    }
}

async function* throwingIterator(error: Error): AsyncGenerator<never> {
    throw error;
}

function setupDriveMocks(
    driveInvitations: ReturnType<typeof fakeInvitation>[],
    photosInvitations: ReturnType<typeof fakeInvitation>[]
) {
    getDrive.mockReturnValue({
        iterateInvitations: () => asyncIteratorFrom(driveInvitations),
    });
    getDriveForPhotos.mockReturnValue({
        iterateInvitations: () => asyncIteratorFrom(photosInvitations),
    });
}

const mockCreateNotification = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    useSharedWithMeStore.getState().clearAll();
    jest.mocked(getNotificationsManager).mockReturnValue({
        createNotification: mockCreateNotification,
    } as any);
});

describe('loadInvitations', () => {
    it('loads drive and photos invitations into the store', async () => {
        setupDriveMocks([fakeInvitation('inv-1')], [fakeInvitation('inv-2')]);

        await loadInvitations(new AbortController().signal);

        const items = useSharedWithMeStore.getState().sharedWithMeItems;
        expect(items.has('node-inv-1')).toBe(true);
        expect(items.has('node-inv-2')).toBe(true);
    });

    it('does not show error toast when aborted during drive iteration', async () => {
        const abortController = new AbortController();
        const abortError = new DOMException('Aborted', 'AbortError');

        getDrive.mockReturnValue({
            iterateInvitations: () => throwingIterator(abortError),
        });
        getDriveForPhotos.mockReturnValue({
            iterateInvitations: () => asyncIteratorFrom([]),
        });

        abortController.abort();
        await loadInvitations(abortController.signal);

        expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it('does not show error toast when aborted during photos iteration', async () => {
        const abortController = new AbortController();
        const abortError = new DOMException('Aborted', 'AbortError');

        getDrive.mockReturnValue({
            iterateInvitations: () => asyncIteratorFrom([fakeInvitation('inv-1')]),
        });
        getDriveForPhotos.mockReturnValue({
            iterateInvitations: () => throwingIterator(abortError),
        });

        abortController.abort();
        await loadInvitations(abortController.signal);

        expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it('does not cleanup stale items when aborted', async () => {
        // Pre-populate store with an existing invitation
        useSharedWithMeStore.getState().setSharedWithMeItem({
            nodeUid: 'existing-node',
            name: 'existing',
            type: 'file',
            mediaType: undefined,
            itemType: 0, // ItemType.INVITATION
            activeRevisionUid: undefined,
            size: undefined,
            invitation: { uid: 'existing-inv', sharedBy: 'someone@example.com' },
            shareId: 'share-1',
        } as any);

        const abortController = new AbortController();
        const abortError = new DOMException('Aborted', 'AbortError');

        getDrive.mockReturnValue({
            iterateInvitations: () => throwingIterator(abortError),
        });
        getDriveForPhotos.mockReturnValue({
            iterateInvitations: () => asyncIteratorFrom([]),
        });

        abortController.abort();
        await loadInvitations(abortController.signal);

        // The existing item should still be in the store (not cleaned up)
        expect(useSharedWithMeStore.getState().sharedWithMeItems.has('existing-node')).toBe(true);
    });

    it('shows error toast on real errors (not abort)', async () => {
        getDrive.mockReturnValue({
            iterateInvitations: () => throwingIterator(new Error('network failure')),
        });
        getDriveForPhotos.mockReturnValue({
            iterateInvitations: () => asyncIteratorFrom([]),
        });

        await loadInvitations(new AbortController().signal);

        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
});
